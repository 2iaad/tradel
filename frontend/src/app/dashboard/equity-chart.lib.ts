// Pure drawing/math for the equity chart canvas — no React in here.

export const RANGES = {
    '30D': { n: 24, seed: 11, lo: 20600, hi: 24700 },
    '90D': { n: 61, seed: 23, lo: 17200, hi: 24700 },
    YTD: { n: 127, seed: 37, lo: 9600, hi: 24700 },
    ALL: { n: 214, seed: 51, lo: 6200, hi: 24700 },
} as const;
export type RangeKey = keyof typeof RANGES;

export const REVEAL_MS = 2000;

// Deterministic hash noise in [0,1) — stable curves per seed.
const rand = (i: number) => {
    const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
};

/* Equity points normalized to [0,1]: upward base ramp + random-walk
   drawdowns → "up, but not fake". */
export function curve(range: RangeKey): number[] {
    const { n, seed } = RANGES[range];
    const walk = [0];
    let v = 0;
    for (let i = 1; i <= n; i++) {
        let s = rand(seed + i * 7.13) - 0.5;
        if (rand(seed + i * 13.7) > 0.88) s *= 2.6; // outlier trades
        v += s;
        walk.push(v);
    }
    const min = Math.min(...walk);
    const span = Math.max(...walk) - min || 1;
    return walk.map((wv, i) => {
        const ramp = 0.07 + 0.76 * (i / n);
        const wig = ((wv - min) / span - 0.5) * 0.34;
        return Math.min(1, Math.max(0.02, ramp + wig));
    });
}

const fmt = (v: number) => '$' + Math.round(v).toLocaleString('en-US');
const ease = (p: number) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);

// Everything one frame needs, computed by the hook per draw call.
export interface ChartFrame {
    key: RangeKey;
    pts: number[];
    ghost: boolean;
    reveal: number | null; // reveal start timestamp, null = not started
    reduced: boolean;
    hover: { x: number; y: number } | null;
}

interface Geom {
    px: number;
    py: number;
    pw: number;
    ph: number;
    n: number;
    X: (i: number) => number;
    Y: (v: number) => number;
}

function drawAxes(ctx: CanvasRenderingContext2D, g: Geom, f: ChartFrame, lo: number, hi: number) {
    const dimCol = f.ghost ? '#3d4a4f' : '#5f6b70';
    // grid + y ($) labels
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let gi = 0; gi <= 4; gi++) {
        const t = gi / 4;
        const gy = g.py + (1 - t) * g.ph;
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(g.px, gy + 0.5);
        ctx.lineTo(g.px + g.pw, gy + 0.5);
        ctx.stroke();
        ctx.fillStyle = dimCol;
        ctx.fillText(f.ghost ? '$—' : fmt(lo + t * (hi - lo)), g.px - 10, gy);
    }
    // x (trades) labels
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let gi = 0; gi <= 4; gi++) {
        const i = Math.round((gi / 4) * g.n);
        ctx.fillStyle = dimCol;
        ctx.fillText(String(i), g.X(i), g.py + g.ph + 10);
    }
    ctx.textAlign = 'right';
    ctx.fillText('TRADES →', g.px + g.pw, g.py + g.ph + 22);
}

function tracePath(ctx: CanvasRenderingContext2D, g: Geom, pts: number[]) {
    ctx.beginPath();
    pts.forEach((v, i) => {
        const x = g.X(i);
        const yy = g.Y(v);
        if (i === 0) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
    });
}

// Dashed ghost line — deliberately dim: a preview, not data.
function drawGhostLine(ctx: CanvasRenderingContext2D, g: Geom, pts: number[]) {
    tracePath(ctx, g, pts);
    ctx.setLineDash([6, 7]);
    ctx.strokeStyle = 'rgba(255,255,255,0.13)';
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.setLineDash([]);
}

// Gradient area fill + glowing line for the real curve.
function drawRealLine(ctx: CanvasRenderingContext2D, g: Geom, pts: number[]) {
    tracePath(ctx, g, pts);
    ctx.lineTo(g.px + g.pw, g.py + g.ph);
    ctx.lineTo(g.px, g.py + g.ph);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, g.py, 0, g.py + g.ph);
    grad.addColorStop(0, 'rgba(47,213,127,0.20)');
    grad.addColorStop(1, 'rgba(47,213,127,0)');
    ctx.fillStyle = grad;
    ctx.fill();
    tracePath(ctx, g, pts);
    ctx.strokeStyle = '#2fd57f';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(47,213,127,0.55)';
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.shadowBlur = 0;
}

// Pulsing marker dot.
function drawDot(ctx: CanvasRenderingContext2D, dx: number, dy: number) {
    const tt = performance.now() / 1000;
    ctx.beginPath();
    ctx.arc(dx, dy, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#2fd57f';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(dx, dy, 8 + Math.sin(tt * 3) * 2.5, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(47,213,127,0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();
}

// Hover crosshair + tooltip (real chart only, after the reveal).
function drawHover(ctx: CanvasRenderingContext2D, g: Geom, f: ChartFrame, lo: number, hi: number) {
    if (!f.hover) return;
    const i = Math.max(0, Math.min(g.n, Math.round(((f.hover.x - g.px) / g.pw) * g.n)));
    const hx = g.X(i);
    const hy = g.Y(f.pts[i]);
    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(hx + 0.5, g.py);
    ctx.lineTo(hx + 0.5, g.py + g.ph);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(hx, hy, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#0b0e10';
    ctx.fill();
    ctx.strokeStyle = '#2fd57f';
    ctx.lineWidth = 2;
    ctx.stroke();
    // tooltip
    const val = fmt(lo + f.pts[i] * (hi - lo));
    const lbl = 'TRADE #' + i;
    ctx.font = '600 12px "JetBrains Mono", monospace';
    const tw = Math.max(ctx.measureText(val).width, ctx.measureText(lbl).width) + 24;
    const bx = Math.min(Math.max(hx - tw / 2, g.px), g.px + g.pw - tw);
    const by = Math.max(g.py, hy - 62);
    ctx.fillStyle = '#0a0d0f';
    ctx.strokeStyle = '#222a2f';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(bx, by, tw, 46, 6);
    ctx.fill();
    ctx.stroke();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#2fd57f';
    ctx.fillText(val, bx + 12, by + 20);
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#5f6b70';
    ctx.fillText(lbl, bx + 12, by + 36);
}

// Sizes the canvas to its element and returns a 2d ctx, or null to skip.
function prepare(canvas: HTMLCanvasElement) {
    if (!canvas.isConnected) return null;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return null;
    const W = Math.round(w * dpr);
    const H = Math.round(h * dpr);
    if (canvas.width !== W || canvas.height !== H) {
        canvas.width = W;
        canvas.height = H;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    return { ctx, w, h };
}

// Paints one full frame of the equity chart.
export function drawChart(canvas: HTMLCanvasElement, f: ChartFrame) {
    const prep = prepare(canvas);
    if (!prep) return;
    const { ctx, w, h } = prep;
    const { n, lo, hi } = RANGES[f.key];

    // plot box (space for $ labels left, trade-count labels bottom)
    const px = 64;
    const py = 16;
    const pw = w - px - 18;
    const ph = h - py - 34;
    const g: Geom = {
        px,
        py,
        pw,
        ph,
        n,
        X: (i) => px + (i / n) * pw,
        Y: (v) => py + (1 - v) * ph,
    };

    drawAxes(ctx, g, f, lo, hi);

    // reveal progress
    let p = 0;
    if (f.reduced) p = 1;
    else if (f.reveal != null) p = Math.min(1, (performance.now() - f.reveal) / REVEAL_MS);
    if (p === 0) return;

    // clip to the revealed slice — grows from the left edge rightward
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, px + pw * ease(p) + 20, h);
    ctx.clip();
    if (f.ghost) drawGhostLine(ctx, g, f.pts);
    else drawRealLine(ctx, g, f.pts);
    ctx.restore();

    // pulsing dot: ghost marks trade #1 (where the real curve will
    // begin); real marks the newest trade once the reveal completes
    if (f.ghost) drawDot(ctx, g.X(0), g.Y(f.pts[0]));
    else if (p === 1) drawDot(ctx, g.X(n), g.Y(f.pts[n]));

    if (!f.ghost && f.hover && f.hover.x >= px && f.hover.x <= px + pw && p === 1)
        drawHover(ctx, g, f, lo, hi);
}
