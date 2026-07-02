"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { login, register } from "@/lib/api";
import { btnCls, errorCls, inputCls, labelCls, linkCls, kickerCls } from "@/lib/ui";
import { Tape, TOP_TICKS, BOTTOM_TICKS } from "@/components/tape";

type Mode = "login" | "register" | "reset";

const formCls =
    "flex-[0_0_33.3333%] box-border flex flex-col justify-center gap-[18px] px-[clamp(40px,7vw,120px)]";
const headingCls =
    "m-0 text-[30px] font-semibold tracking-[-0.01em] text-[#eef4f2]";
const paneEase =
    "transition-transform duration-700 ease-[cubic-bezier(0.77,0,0.18,1)]";

export default function AuthPage() {
    const router = useRouter();
    const [mode, setMode] = useState<Mode>("login");
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const switchMode = (m: Mode) => {
        setError(null);
        setMode(m);
    };

    // Native HTML validation gates submit, so these only surface server errors.
    const submit =
        (action: (f: FormData) => Promise<unknown>) =>
        async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            setPending(true);
            setError(null);
            try {
                await action(new FormData(e.currentTarget));
                router.push("/dashboard"); // pending stays true while navigating
            } catch (err) {
                setError(
                    err instanceof Error ? err.message : "Something went wrong",
                );
                setPending(false);
            }
        };

    const onLogin = submit((f) =>
        login(f.get("email") as string, f.get("password") as string),
    );
    const onRegister = submit((f) =>
        register(
            f.get("username") as string,
            f.get("email") as string,
            f.get("password") as string,
        ),
    );

    // Endlessly scrolling candlestick backdrop — one rAF loop, paused when
    // the tab is hidden; a single static frame for prefers-reduced-motion.
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const reduced = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;
        let raf = 0;
        let last = 0;
        let t = 0;

        // Deterministic hash noise in [0,1) — keeps candles stable as they scroll.
        const rand = (i: number) => {
            const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
            return x - Math.floor(x);
        };
        // Smooth pseudo price walk in ~[0,1] (sum of sines = loops forever).
        const price = (i: number) =>
            0.5 +
            0.26 * Math.sin(i * 0.21) +
            0.15 * Math.sin(i * 0.063 + 1.7) +
            0.09 * Math.sin(i * 0.47 + 4.2);

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

            const step = 30;
            const bodyW = 15;
            const offset = t * 26;
            const first = Math.floor(offset / step) - 1;
            const frac = offset % step;
            const y = (v: number) => 48 + (1 - v) * (h - 130);
            // faint horizontal grid
            ctx.strokeStyle = "rgba(255,255,255,0.045)";
            ctx.lineWidth = 1;
            for (let gy = 48; gy < h - 40; gy += 56) {
                ctx.beginPath();
                ctx.moveTo(0, gy + 0.5);
                ctx.lineTo(w, gy + 0.5);
                ctx.stroke();
            }
            for (let k = 0; k <= w / step + 2; k++) {
                const i = first + k;
                const x = k * step - frac - step / 2;
                const o = price(i);
                const c = price(i + 0.7);
                const hi = Math.max(o, c) + 0.02 + 0.05 * rand(i * 3.1);
                const lo = Math.min(o, c) - 0.02 - 0.05 * rand(i * 7.3);
                const col = c >= o ? "#2fd57f" : "#f0554e";
                ctx.globalAlpha = 0.85;
                ctx.strokeStyle = col;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(x, y(hi));
                ctx.lineTo(x, y(lo));
                ctx.stroke();
                ctx.fillStyle = col;
                const yo = y(o);
                const yc = y(c);
                ctx.fillRect(
                    x - bodyW / 2,
                    Math.min(yo, yc),
                    bodyW,
                    Math.max(2, Math.abs(yc - yo)),
                );
                ctx.globalAlpha = 1;
            }
        };

        const frame = (now: number) => {
            const dt = last ? Math.min((now - last) / 1000, 0.1) : 0.016;
            last = now;
            t += dt;
            draw();
            raf = reduced ? 0 : requestAnimationFrame(frame);
        };
        const start = () => {
            if (!raf) raf = requestAnimationFrame(frame);
        };
        const stop = () => {
            cancelAnimationFrame(raf);
            raf = 0;
            last = 0;
        };
        const onVis = () => (document.hidden ? stop() : start());
        document.addEventListener("visibilitychange", onVis);
        start();
        return () => {
            stop();
            document.removeEventListener("visibilitychange", onVis);
        };
    }, []);

    // ponytail: reset form only preventDefaults — no backend endpoint exists yet.
    const noSubmit = (e: React.FormEvent) => e.preventDefault();

    const shifted = mode !== "login"; // register & reset live on the left
    const trackX = { login: "0%", register: "-33.3334%", reset: "-66.6667%" }[
        mode
    ];

    return (
        <div className="relative w-full h-screen min-h-[640px] bg-[#0b0e10] overflow-hidden">
            <Tape
                items={TOP_TICKS}
                duration="46s"
                className="absolute top-0 left-0 right-0 h-11 border-b border-[#1b2226]"
            />

            {/* middle band holds the two sliding panels, between the tapes */}
            <div className="absolute top-[45px] bottom-[45px] left-0 right-0 overflow-hidden">
                {/* visual half: slides right when register/reset is open */}
                <div
                    className={`absolute inset-y-0 left-0 w-1/2 overflow-hidden bg-[#07090b] z-[1] ${paneEase}`}
                    style={{ transform: `translateX(${shifted ? "100%" : "0%"})` }}
                >
                    <canvas
                        ref={canvasRef}
                        className="absolute top-0 left-0 w-full h-full opacity-[0.92]"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,9,11,0.3)_0%,rgba(7,9,11,0)_30%,rgba(7,9,11,0.9)_82%)]" />
                    <div className="absolute inset-0 flex flex-col justify-between box-border px-[52px] py-11">
                        <div className="flex items-center gap-2.5">
                            <span className="w-[9px] h-[9px] rounded-full bg-[#2fd57f] animate-[tradelPulse_2.2s_ease-out_infinite]" />
                            <span className="font-mono text-[13px] font-semibold tracking-[0.22em] text-[#e8efec]">
                                TRADEL
                            </span>
                        </div>
                        <div className="flex flex-col gap-3.5">
                            <h1 className="m-0 text-[clamp(36px,3.4vw,52px)] font-semibold leading-[1.12] tracking-[-0.015em] text-[#eef4f1]">
                                Every trade,
                                <br />
                                on the record.
                                <span className="inline-block w-[13px] h-[0.78em] bg-[#2fd57f] ml-[9px] align-[-2px] animate-[tradelBlink_1.1s_steps(1)_infinite]" />
                            </h1>
                            <p className="m-0 text-[15px] leading-[1.5] text-[#7e8d89] max-w-[360px]">
                                Log entries, exits, and the reasoning between them.
                            </p>
                        </div>
                    </div>
                </div>

                {/* form half: sits right, swipes left over the visual */}
                <div
                    className={`absolute inset-y-0 left-1/2 w-1/2 overflow-hidden bg-[#0e1214] border-l border-[#1b2226] z-[2] ${paneEase}`}
                    style={{ transform: `translateX(${shifted ? "-100%" : "0%"})` }}
                >
                    {/* 3-form strip: login / register / reset */}
                    <div
                        className="flex w-[300%] h-full transition-transform duration-[650ms] ease-[cubic-bezier(0.77,0,0.18,1)]"
                        style={{ transform: `translateX(${trackX})` }}
                    >
                        {/* login */}
                        <form onSubmit={onLogin} className={formCls}>
                            <div className="mb-2">
                                <div className={`${kickerCls} mb-3`}>{"/// SIGN IN"}</div>
                                <h2 className={headingCls}>Welcome back</h2>
                            </div>
                            <div>
                                <label className={labelCls}>Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    maxLength={50}
                                    placeholder="you@example.com"
                                    className={inputCls}
                                />
                            </div>
                            <div>
                                <label className={labelCls}>Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    required
                                    placeholder="••••••••"
                                    className={inputCls}
                                />
                            </div>
                            <div className="flex justify-between items-center">
                                <label className="flex items-center gap-2 text-[13px] text-[#93a09d] cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="accent-[#2fd57f] w-[15px] h-[15px] m-0"
                                    />
                                    Remember me
                                </label>
                                <button
                                    type="button"
                                    onClick={() => switchMode("reset")}
                                    className={`${linkCls} text-[13px]`}
                                >
                                    Forgot password?
                                </button>
                            </div>
                            {error && <p className={errorCls}>{error}</p>}
                            <button type="submit" disabled={pending} className={btnCls}>
                                Sign in
                            </button>
                            <p className="mt-1 mb-0 text-[13.5px] text-[#6b7a76] text-center">
                                New to Tradel?{" "}
                                <button
                                    type="button"
                                    onClick={() => switchMode("register")}
                                    className={`${linkCls} text-[13.5px]`}
                                >
                                    Create an account
                                </button>
                            </p>
                        </form>

                        {/* register */}
                        <form onSubmit={onRegister} className={formCls}>
                            <div className="mb-2">
                                <div className={`${kickerCls} mb-3`}>{"/// CREATE ACCOUNT"}</div>
                                <h2 className={headingCls}>Start your journal</h2>
                            </div>
                            <div>
                                <label className={labelCls}>Username</label>
                                <input
                                    type="text"
                                    name="username"
                                    required
                                    minLength={3}
                                    maxLength={15}
                                    placeholder="alextrader"
                                    className={inputCls}
                                />
                            </div>
                            <div>
                                <label className={labelCls}>Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    maxLength={50}
                                    placeholder="you@example.com"
                                    className={inputCls}
                                />
                            </div>
                            <div>
                                <label className={labelCls}>Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    required
                                    minLength={10}
                                    maxLength={20}
                                    pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*"
                                    title="Must include a lowercase letter, an uppercase letter and a number"
                                    placeholder="10+ characters"
                                    className={inputCls}
                                />
                            </div>
                            {error && <p className={errorCls}>{error}</p>}
                            <button type="submit" disabled={pending} className={btnCls}>
                                Create account
                            </button>
                            <p className="mt-1 mb-0 text-[13.5px] text-[#6b7a76] text-center">
                                Already have an account?{" "}
                                <button
                                    type="button"
                                    onClick={() => switchMode("login")}
                                    className={`${linkCls} text-[13.5px]`}
                                >
                                    Sign in
                                </button>
                            </p>
                        </form>

                        {/* reset password */}
                        <form onSubmit={noSubmit} className={formCls}>
                            <div className="mb-2">
                                <div className={`${kickerCls} mb-3`}>{"/// RESET PASSWORD"}</div>
                                <h2 className={headingCls}>Recover access</h2>
                            </div>
                            <p className="m-0 text-sm leading-[1.55] text-[#78878a]">
                                Enter the email tied to your account and we&rsquo;ll send a
                                secure reset link.
                            </p>
                            <div>
                                <label className={labelCls}>Email</label>
                                <input
                                    type="email"
                                    placeholder="you@example.com"
                                    className={inputCls}
                                />
                            </div>
                            <button type="submit" className={btnCls}>
                                Send reset link
                            </button>
                            <p className="mt-1 mb-0 text-center">
                                <button
                                    type="button"
                                    onClick={() => switchMode("login")}
                                    className={`${linkCls} text-[13.5px]`}
                                >
                                    &larr; Back to sign in
                                </button>
                            </p>
                        </form>
                    </div>
                </div>
            </div>

            <Tape
                items={BOTTOM_TICKS}
                duration="58s"
                reverse
                className="absolute bottom-0 left-0 right-0 h-11 border-t border-[#1b2226]"
            />
        </div>
    );
}
