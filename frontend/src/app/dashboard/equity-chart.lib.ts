// Pure drawing/math for the equity chart canvas — no React in here.

import { clientSize } from '@/lib/canvas-size';
import type { ApiTrade } from '@/stores/trades';

// Range keys → trailing-window length in days. YTD/ALL computed per-call.
export const RANGES = {
    '30D': 30,
    '90D': 90,
    YTD: 'ytd',
    ALL: 'all',
} as const;
export type RangeKey = keyof typeof RANGES;

export const REVEAL_MS = 2000;

// Real equity series for a range: cumulative starting_balance + closed-trade
// P&L, ordered by close time. `pts` is normalized to [0,1] against [lo,hi];
// `sig` invalidates the static-layer cache when the underlying data changes.
export interface Series {
    pts: number[];
    lo: number;
    hi: number;
    sig: string;
}

// Window start (ms) for a range key, relative to now. ALL → 0 (everything).
function windowStart(key: RangeKey): number {
    const r = RANGES[key];
    if (r === 'all') return 0;
    if (r === 'ytd') return new Date(new Date().getFullYear(), 0, 1).getTime();
    return Date.now() - r * 86400_000;
}

/* Builds the equity series from closed trades. A trade counts as closed once
   it has a pnl (matching the dashboard stats), ordered by when it was logged
   (created_at). Equity climbs by each trade's pnl in that order; the window's
   first point is seeded at the running equity *before* the window (so a 30D
   view starts at the right balance, not the base). Flat line at
   startingBalance when nothing closed. */
const closedTime = (t: ApiTrade) => Date.parse(t.created_at);

export function buildSeries(
    trades: ApiTrade[],
    startingBalance: number,
    key: RangeKey,
): Series {
    const closed = trades
        .filter((t) => t.pnl !== null)
        .sort((a, b) => closedTime(a) - closedTime(b));

    const start = windowStart(key);
    let running = startingBalance;
    let i = 0;
    // Fast-forward through trades that closed before the window.
    for (; i < closed.length && closedTime(closed[i]) < start; i++)
        running += parseFloat(closed[i].pnl!);

    const equity = [running]; // seed at pre-window running equity
    for (; i < closed.length; i++) {
        running += parseFloat(closed[i].pnl!);
        equity.push(running);
    }
    // Nothing closed in-window: draw a flat 2-point line, not a single point
    // (the geometry divides by the trade-index span).
    if (equity.length === 1) equity.push(running);

    let lo = Math.min(...equity);
    let hi = Math.max(...equity);
    if (lo === hi) {
        // Flat series: pad so normalization doesn't divide by zero.
        const pad = Math.abs(lo) * 0.01 || 1;
        lo -= pad;
        hi += pad;
    }
    const span = hi - lo;
    const pts = equity.map((v) => (v - lo) / span);
    const sig = `${key}:${equity.length}:${equity[equity.length - 1]}`;
    return { pts, lo, hi, sig };
}

const fmt = (v: number) => '$' + Math.round(v).toLocaleString('en-US');
const ease = (p: number) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);

// Everything one frame needs, computed by the hook per draw call.
export interface ChartFrame {
    pts: number[];
    lo: number;
    hi: number;
    sig: string; // static-layer cache key: changes when the data changes
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

function drawAxes(ctx: CanvasRenderingContext2D, g: Geom, lo: number, hi: number) {
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
        ctx.fillStyle = '#5f6b70';
        ctx.fillText(fmt(lo + t * (hi - lo)), g.px - 10, gy);
    }
    // x (trades) labels
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let gi = 0; gi <= 4; gi++) {
        const i = Math.round((gi / 4) * g.n);
        ctx.fillStyle = '#5f6b70';
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

// Pulsing marker dot on the newest trade once the reveal completes.
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

/* Cached static layer (axes + finished curve) per canvas. Once the reveal
   completes only the dot pulses and the hover moves, yet every frame was
   re-stroking the glow line (shadowBlur), gradient fill, and axis text at
   60fps — the expensive part. Render that once offscreen and blit it. */
interface StaticLayer {
    sig: string;
    w: number;
    h: number;
    cv: HTMLCanvasElement;
}
const layers = new WeakMap<HTMLCanvasElement, StaticLayer>();

function staticLayer(
    canvas: HTMLCanvasElement,
    f: ChartFrame,
    g: Geom,
    lo: number,
    hi: number,
    w: number,
    h: number,
) {
    const prev = layers.get(canvas);
    if (prev && prev.sig === f.sig && prev.w === canvas.width && prev.h === canvas.height)
        return prev.cv;
    const cv = document.createElement('canvas');
    cv.width = canvas.width;
    cv.height = canvas.height;
    const ctx = cv.getContext('2d');
    if (!ctx) return null;
    ctx.setTransform(canvas.width / w, 0, 0, canvas.height / h, 0, 0);
    drawAxes(ctx, g, lo, hi);
    drawRealLine(ctx, g, f.pts);
    layers.set(canvas, { sig: f.sig, w: canvas.width, h: canvas.height, cv });
    return cv;
}

// Sizes the canvas to its element and returns a 2d ctx, or null to skip.
function prepare(canvas: HTMLCanvasElement) {
    if (!canvas.isConnected) return null;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const { w, h } = clientSize(canvas);
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
    const { lo, hi } = f;
    const n = f.pts.length - 1; // point count → last trade index

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

    // reveal progress
    let p = 0;
    if (f.reduced) p = 1;
    else if (f.reveal != null) p = Math.min(1, (performance.now() - f.reveal) / REVEAL_MS);

    const layer = p === 1 ? staticLayer(canvas, f, g, lo, hi, w, h) : null;
    if (layer) {
        // settled chart: one blit instead of a full redraw
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.drawImage(layer, 0, 0);
        ctx.restore();
    } else {
        drawAxes(ctx, g, lo, hi);
        if (p === 0) return;

        // clip to the revealed slice — grows from the left edge rightward
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, px + pw * ease(p) + 20, h);
        ctx.clip();
        drawRealLine(ctx, g, f.pts);
        ctx.restore();
    }

    // pulsing dot marks the newest trade once the reveal completes
    if (p === 1) drawDot(ctx, g.X(n), g.Y(f.pts[n]));

    if (f.hover && f.hover.x >= px && f.hover.x <= px + pw && p === 1)
        drawHover(ctx, g, f, lo, hi);
}
