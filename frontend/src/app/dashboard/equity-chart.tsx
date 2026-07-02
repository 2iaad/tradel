"use client";

import { useEffect, useRef } from "react";

export const RANGES = {
    "30D": { n: 24, seed: 11, lo: 20600, hi: 24700 },
    "90D": { n: 61, seed: 23, lo: 17200, hi: 24700 },
    YTD: { n: 127, seed: 37, lo: 9600, hi: 24700 },
    ALL: { n: 214, seed: 51, lo: 6200, hi: 24700 },
} as const;
export type RangeKey = keyof typeof RANGES;

const REVEAL_MS = 2000;

// Deterministic hash noise in [0,1) — stable curves per seed.
const rand = (i: number) => {
    const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
};

/* Equity points normalized to [0,1]: upward base ramp + random-walk
   drawdowns → "up, but not fake". */
function curve(range: RangeKey): number[] {
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

const fmt = (v: number) => "$" + Math.round(v).toLocaleString("en-US");
const ease = (p: number) =>
    p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;

/* Canvas equity curve. Reveal animation (left-to-right) runs when the
   chart scrolls into view and re-arms when it fully leaves; one rAF
   loop, paused on hidden tab; static full curve for reduced motion.
   ghost mode draws the dim dashed preview for the guest dashboard. */
export function EquityChart({
    range = "YTD",
    ghost = false,
}: {
    range?: RangeKey;
    ghost?: boolean;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rangeRef = useRef(range);
    const revealT0 = useRef<number | null>(null);

    // Range switch replays the reveal (skip the initial render).
    useEffect(() => {
        if (rangeRef.current !== range) {
            rangeRef.current = range;
            revealT0.current = performance.now();
        }
    }, [range]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const reduced = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;
        let raf = 0;
        let played = false;
        let hover: { x: number; y: number } | null = null;
        const curves: Partial<Record<RangeKey, number[]>> = {};

        const draw = () => {
            if (!canvas.isConnected) return;
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const w = canvas.clientWidth;
            const h = canvas.clientHeight;
            if (!w || !h) return;
            const W = Math.round(w * dpr);
            const H = Math.round(h * dpr);
            if (canvas.width !== W || canvas.height !== H) {
                canvas.width = W;
                canvas.height = H;
            }
            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, w, h);

            const key = rangeRef.current;
            const { n, lo, hi } = RANGES[key];
            const pts = (curves[key] ??= curve(key));
            // plot box (space for $ labels left, trade-count labels bottom)
            const px = 64;
            const py = 16;
            const pw = w - px - 18;
            const ph = h - py - 34;
            const X = (i: number) => px + (i / n) * pw;
            const Y = (v: number) => py + (1 - v) * ph;
            const dimCol = ghost ? "#3d4a4f" : "#5f6b70";

            // grid + y ($) labels
            ctx.font = '10px "JetBrains Mono", monospace';
            ctx.textAlign = "right";
            ctx.textBaseline = "middle";
            for (let g = 0; g <= 4; g++) {
                const t = g / 4;
                const gy = py + (1 - t) * ph;
                ctx.strokeStyle = "rgba(255,255,255,0.05)";
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(px, gy + 0.5);
                ctx.lineTo(px + pw, gy + 0.5);
                ctx.stroke();
                ctx.fillStyle = dimCol;
                ctx.fillText(ghost ? "$—" : fmt(lo + t * (hi - lo)), px - 10, gy);
            }
            // x (trades) labels
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            for (let g = 0; g <= 4; g++) {
                const i = Math.round((g / 4) * n);
                ctx.fillStyle = dimCol;
                ctx.fillText(String(i), X(i), py + ph + 10);
            }
            ctx.textAlign = "right";
            ctx.fillText("TRADES →", px + pw, py + ph + 22);

            // reveal progress
            let p = 0;
            if (reduced) p = 1;
            else if (revealT0.current != null)
                p = Math.min(1, (performance.now() - revealT0.current) / REVEAL_MS);
            if (p === 0) return;
            const e = ease(p);

            // clip to the revealed slice — grows from the left edge rightward
            ctx.save();
            ctx.beginPath();
            ctx.rect(0, 0, px + pw * e + 20, h);
            ctx.clip();

            const tracePath = () => {
                ctx.beginPath();
                pts.forEach((v, i) => {
                    const x = X(i);
                    const yy = Y(v);
                    if (i === 0) ctx.moveTo(x, yy);
                    else ctx.lineTo(x, yy);
                });
            };

            if (ghost) {
                // dashed ghost line — deliberately dim: a preview, not data
                tracePath();
                ctx.setLineDash([6, 7]);
                ctx.strokeStyle = "rgba(255,255,255,0.13)";
                ctx.lineWidth = 1.5;
                ctx.lineJoin = "round";
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.restore();
            } else {
                // area fill
                tracePath();
                ctx.lineTo(px + pw, py + ph);
                ctx.lineTo(px, py + ph);
                ctx.closePath();
                const grad = ctx.createLinearGradient(0, py, 0, py + ph);
                grad.addColorStop(0, "rgba(47,213,127,0.20)");
                grad.addColorStop(1, "rgba(47,213,127,0)");
                ctx.fillStyle = grad;
                ctx.fill();
                // line with glow
                tracePath();
                ctx.strokeStyle = "#2fd57f";
                ctx.lineWidth = 2;
                ctx.lineJoin = "round";
                ctx.shadowColor = "rgba(47,213,127,0.55)";
                ctx.shadowBlur = 12;
                ctx.stroke();
                ctx.shadowBlur = 0;
                ctx.restore();
            }

            // pulsing dot: ghost marks trade #1 (where the real curve will
            // begin); real marks the newest trade once the reveal completes
            const tt = performance.now() / 1000;
            const dot = (dx: number, dy: number) => {
                ctx.beginPath();
                ctx.arc(dx, dy, 3.5, 0, Math.PI * 2);
                ctx.fillStyle = "#2fd57f";
                ctx.fill();
                ctx.beginPath();
                ctx.arc(dx, dy, 8 + Math.sin(tt * 3) * 2.5, 0, Math.PI * 2);
                ctx.strokeStyle = "rgba(47,213,127,0.35)";
                ctx.lineWidth = 1;
                ctx.stroke();
            };
            if (ghost) dot(X(0), Y(pts[0]));
            else if (p === 1) dot(X(n), Y(pts[n]));

            // hover crosshair + tooltip (real chart only)
            if (!ghost && hover && hover.x >= px && hover.x <= px + pw && p === 1) {
                const i = Math.max(
                    0,
                    Math.min(n, Math.round(((hover.x - px) / pw) * n)),
                );
                const hx = X(i);
                const hy = Y(pts[i]);
                ctx.strokeStyle = "rgba(255,255,255,0.14)";
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(hx + 0.5, py);
                ctx.lineTo(hx + 0.5, py + ph);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(hx, hy, 4, 0, Math.PI * 2);
                ctx.fillStyle = "#0b0e10";
                ctx.fill();
                ctx.strokeStyle = "#2fd57f";
                ctx.lineWidth = 2;
                ctx.stroke();
                // tooltip
                const val = fmt(lo + pts[i] * (hi - lo));
                const lbl = "TRADE #" + i;
                ctx.font = '600 12px "JetBrains Mono", monospace';
                const tw =
                    Math.max(ctx.measureText(val).width, ctx.measureText(lbl).width) +
                    24;
                const bx = Math.min(Math.max(hx - tw / 2, px), px + pw - tw);
                const by = Math.max(py, hy - 62);
                ctx.fillStyle = "#0a0d0f";
                ctx.strokeStyle = "#222a2f";
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.roundRect(bx, by, tw, 46, 6);
                ctx.fill();
                ctx.stroke();
                ctx.textAlign = "left";
                ctx.textBaseline = "alphabetic";
                ctx.fillStyle = "#2fd57f";
                ctx.fillText(val, bx + 12, by + 20);
                ctx.font = '10px "JetBrains Mono", monospace';
                ctx.fillStyle = "#5f6b70";
                ctx.fillText(lbl, bx + 12, by + 36);
            }
        };

        const tick = () => {
            draw();
            raf = requestAnimationFrame(tick);
        };
        const start = () => {
            if (!raf) raf = requestAnimationFrame(tick);
        };
        const stop = () => {
            cancelAnimationFrame(raf);
            raf = 0;
        };

        // Trigger the reveal when the chart scrolls into view; re-arm
        // after it fully leaves the viewport.
        const io = new IntersectionObserver(
            (entries) => {
                const en = entries[0];
                if (en.intersectionRatio >= 0.35 && !played) {
                    played = true;
                    revealT0.current = performance.now();
                } else if (en.intersectionRatio === 0) {
                    played = false;
                    revealT0.current = null;
                }
            },
            { threshold: [0, 0.35] },
        );
        io.observe(canvas);

        // Hover crosshair — local vars only, zero re-renders.
        const onMove = (ev: MouseEvent) => {
            const r = canvas.getBoundingClientRect();
            hover = { x: ev.clientX - r.left, y: ev.clientY - r.top };
        };
        const onLeave = () => {
            hover = null;
        };
        if (!ghost) {
            canvas.addEventListener("mousemove", onMove);
            canvas.addEventListener("mouseleave", onLeave);
        }
        const onVis = () => (document.hidden ? stop() : start());
        document.addEventListener("visibilitychange", onVis);
        start();

        return () => {
            stop();
            io.disconnect();
            canvas.removeEventListener("mousemove", onMove);
            canvas.removeEventListener("mouseleave", onLeave);
            document.removeEventListener("visibilitychange", onVis);
        };
    }, [ghost]);

    return (
        <canvas
            ref={canvasRef}
            className={`w-full h-[340px] block ${ghost ? "" : "cursor-crosshair"}`}
        />
    );
}
