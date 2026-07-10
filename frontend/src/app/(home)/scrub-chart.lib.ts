// Pure drawing/math for the landing-page equity scrub — no React in here.

const N = 127;
const SEED = 37;
const LO = 9600;
const HI = 24700;

// Deterministic hash noise in [0,1).
const rand = (i: number) => {
    const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
};

/* Equity points normalized to [0,1]: upward ramp + random-walk drawdowns.
   ponytail: same walk as app/dashboard/equity-chart.lib — lift into src/lib
   if a third consumer shows up. */
let cache: number[] | null = null;
function curve(): number[] {
    if (cache) return cache;
    const walk = [0];
    let v = 0;
    for (let i = 1; i <= N; i++) {
        let s = rand(SEED + i * 7.13) - 0.5;
        if (rand(SEED + i * 13.7) > 0.88) s *= 2.6; // outlier trades
        v += s;
        walk.push(v);
    }
    const min = Math.min(...walk);
    const span = Math.max(...walk) - min || 1;
    cache = walk.map((wv, i) => {
        const ramp = 0.07 + 0.76 * (i / N);
        const wig = ((wv - min) / span - 0.5) * 0.34;
        return Math.min(1, Math.max(0.02, ramp + wig));
    });
    return cache;
}

const fmt = (v: number) => '$' + Math.round(v).toLocaleString('en-US');

interface Geom {
    px: number;
    py: number;
    pw: number;
    ph: number;
    X: (i: number) => number;
    Y: (v: number) => number;
}

function drawAxes(ctx: CanvasRenderingContext2D, g: Geom) {
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
        ctx.fillStyle = '#5f6b70';
        ctx.fillText(fmt(LO + t * (HI - LO)), g.px - 10, gy);
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let gi = 0; gi <= 4; gi++) {
        const i = Math.round((gi / 4) * N);
        ctx.fillStyle = '#5f6b70';
        ctx.fillText(String(i), g.X(i), g.py + g.ph + 9);
    }
    ctx.textAlign = 'right';
    ctx.fillText('TRADES →', g.px + g.pw, g.py + g.ph + 21);
}

function tracePath(ctx: CanvasRenderingContext2D, g: Geom, pts: number[]) {
    ctx.beginPath();
    pts.forEach((v, i) => {
        if (i === 0) ctx.moveTo(g.X(i), g.Y(v));
        else ctx.lineTo(g.X(i), g.Y(v));
    });
}

// Gradient area fill + glowing line, clipped to the revealed slice.
function drawLine(ctx: CanvasRenderingContext2D, g: Geom, pts: number[], e: number, h: number) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, g.px + g.pw * e + 2, h);
    ctx.clip();
    tracePath(ctx, g, pts);
    ctx.lineTo(g.px + g.pw, g.py + g.ph);
    ctx.lineTo(g.px, g.py + g.ph);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, g.py, 0, g.py + g.ph);
    grad.addColorStop(0, 'rgba(47,213,127,0.18)');
    grad.addColorStop(1, 'rgba(47,213,127,0)');
    ctx.fillStyle = grad;
    ctx.fill();
    tracePath(ctx, g, pts);
    ctx.strokeStyle = '#2fd57f';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(47,213,127,0.5)';
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
}

// Marker riding the drawing tip of the revealed curve.
function drawTip(ctx: CanvasRenderingContext2D, g: Geom, pts: number[], e: number) {
    const fi = e * N;
    const i0 = Math.min(N - 1, Math.floor(fi));
    const tipV = pts[i0] + (pts[Math.min(N, i0 + 1)] - pts[i0]) * (fi - i0);
    const ex = g.X(fi);
    const ey = g.Y(tipV);
    ctx.beginPath();
    ctx.arc(ex, ey, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#2fd57f';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ex, ey, 8, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(47,213,127,0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();
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

// Paints one frame of the scrubbed equity chart at progress e in [0,1].
export function drawScrubChart(canvas: HTMLCanvasElement, e: number) {
    const prep = prepare(canvas);
    if (!prep) return;
    const { ctx, w, h } = prep;
    const px = 62;
    const py = 14;
    const pw = w - px - 16;
    const ph = h - py - 32;
    const g: Geom = {
        px,
        py,
        pw,
        ph,
        X: (i) => px + (i / N) * pw,
        Y: (v) => py + (1 - v) * ph,
    };
    drawAxes(ctx, g);
    if (e <= 0) return;
    const pts = curve();
    drawLine(ctx, g, pts, e, h);
    drawTip(ctx, g, pts, e);
}
