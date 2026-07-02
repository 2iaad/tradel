"use client";

import Link from "next/link";
import { useState } from "react";

import { register } from "@/lib/api";
import { btnCls, errorCls, inputCls, kickerCls, labelCls, linkCls } from "@/lib/ui";
import { dateStamp } from "./full";
import { EquityChart } from "./equity-chart";

const cardCls = "bg-[#0e1214] border border-[#1b2226] rounded-[10px]";
const h2Cls = "m-0 text-[17px] font-semibold text-[#eef4f2]";
const ctaCls =
    "border-none rounded-lg px-[18px] py-[11px] bg-[#2fd57f] text-[#04130a] font-semibold text-[13.5px] cursor-pointer transition-[background,transform] hover:bg-[#4ce392] active:scale-[0.97]";
const emptyBoxCls =
    "flex-1 flex flex-col items-center justify-center gap-2 border border-dashed border-[#2b343a] rounded-lg px-5 py-9";
const emptyKickerCls =
    "font-mono text-[10.5px] font-medium tracking-[0.2em] text-[#5f6b70]";

const STEPS = [
    { num: "01", title: "Create your account", desc: "Free. Takes under a minute." },
    { num: "02", title: "Log your first trade", desc: "Entry, exit, size — and why you took it." },
    { num: "03", title: "Review your stats", desc: "Win rate, R multiples, and your equity curve." },
];

const EMPTY_STATS = [
    { label: "NET P&L", sub: "AWAITING FIRST TRADE" },
    { label: "WIN RATE", sub: "AWAITING FIRST TRADE" },
    { label: "PROFIT FACTOR", sub: "AWAITING FIRST TRADE" },
];

function CreateAccountModal({ onClose }: { onClose: () => void }) {
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        setPending(true);
        setError(null);
        try {
            await register(
                f.get("username") as string,
                f.get("email") as string,
                f.get("password") as string,
            );
            // Refresh cookie is set now — reload flips the layout to the
            // signed-in dashboard.
            location.reload();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
            setPending(false);
        }
    };

    return (
        <div
            onClick={onClose}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(4,6,8,0.7)] backdrop-blur-[6px] animate-[tradelFadeIn_0.25s_ease]"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="w-[400px] max-w-[calc(100vw-48px)] box-border bg-[#0e1214] border border-[#222a2f] rounded-xl px-[30px] py-7 flex flex-col gap-[18px] animate-[tradelPopIn_0.3s_cubic-bezier(0.34,1.4,0.44,1)]"
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-2.5">
                        <span className={kickerCls}>{"/// CREATE ACCOUNT"}</span>
                        <h2 className="m-0 text-2xl font-semibold tracking-[-0.01em] text-[#eef4f2]">
                            Start your journal
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="bg-transparent border-none p-0.5 text-[#5f6b70] text-lg leading-none cursor-pointer hover:text-[#eef4f2]"
                    >
                        ×
                    </button>
                </div>
                <form onSubmit={onSubmit} className="flex flex-col gap-4">
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
                        Create free account
                    </button>
                    <p className="m-0 text-[13px] text-[#6b7a76] text-center">
                        Already have an account?{" "}
                        <Link href="/" className={`${linkCls} no-underline text-[13px]`}>
                            Sign in
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}

export function GuestDashboard() {
    const [modal, setModal] = useState(false);
    const open = () => setModal(true);

    return (
        <div className="w-full max-w-[1240px] box-border mx-auto px-9 pt-8 pb-12 flex flex-col gap-5">
            {/* page header */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1.5">
                    <div className={kickerCls}>{"/// DASHBOARD · GUEST PREVIEW"}</div>
                    <h1 className="m-0 text-[26px] font-semibold tracking-[-0.01em] text-[#eef4f2]">
                        Welcome to Tradel
                    </h1>
                </div>
                <div className="flex items-center gap-3.5">
                    <span className="font-mono text-[11px] font-medium tracking-[0.1em] text-[#5f6b70]">
                        {dateStamp()}
                    </span>
                    <button type="button" onClick={open} className={ctaCls}>
                        Create free account
                    </button>
                </div>
            </div>

            {/* onboarding checklist — step 01 active, rest locked */}
            <div className="grid grid-cols-3 gap-4">
                {STEPS.map((s, i) => {
                    const active = i === 0;
                    return (
                        <button
                            key={s.num}
                            type="button"
                            onClick={active ? open : undefined}
                            className={`text-left bg-[#0e1214] border rounded-[10px] px-5 py-[18px] flex flex-col gap-2 transition-[border-color,transform] duration-200 hover:-translate-y-0.5 ${
                                active
                                    ? "border-[#2fd57f] cursor-pointer"
                                    : "border-[#1b2226] opacity-55 cursor-default"
                            }`}
                        >
                            <span className="flex items-center justify-between">
                                <span
                                    className={`font-mono text-[11px] font-semibold tracking-[0.14em] ${active ? "text-[#2fd57f]" : "text-[#5f6b70]"}`}
                                >
                                    {s.num}
                                </span>
                                <span
                                    className={`font-mono text-[9.5px] font-semibold tracking-[0.1em] ${active ? "text-[#2fd57f]" : "text-[#5f6b70]"}`}
                                >
                                    {active ? "START →" : "LOCKED"}
                                </span>
                            </span>
                            <span
                                className={`text-base font-semibold ${active ? "text-[#eef4f2]" : "text-[#93a09d]"}`}
                            >
                                {s.title}
                            </span>
                            <span className="text-[12.5px] leading-normal text-[#7e8d89]">
                                {s.desc}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* empty stat cards */}
            <div className="grid grid-cols-4 gap-4">
                {EMPTY_STATS.map((s) => (
                    <div
                        key={s.label}
                        className={`${cardCls} px-5 py-[18px] flex flex-col gap-2 transition-colors hover:border-[#2b343a]`}
                    >
                        <span className="font-mono text-[10.5px] font-medium tracking-[0.14em] text-[#5f6b70]">
                            {s.label}
                        </span>
                        <span className="text-[26px] font-semibold text-[#3d4a4f]">—</span>
                        <span className="font-mono text-[11px] font-medium text-[#5f6b70]">
                            {s.sub}
                        </span>
                    </div>
                ))}
                <div
                    className={`${cardCls} px-5 py-[18px] flex flex-col gap-2 transition-colors hover:border-[#2b343a]`}
                >
                    <span className="font-mono text-[10.5px] font-medium tracking-[0.14em] text-[#5f6b70]">
                        TRADES LOGGED
                    </span>
                    <span className="text-[26px] font-semibold text-[#eef4f2]">0</span>
                    <span className="font-mono text-[11px] font-medium text-[#5f6b70]">
                        LOG A TRADE TO BEGIN
                    </span>
                </div>
            </div>

            {/* empty equity curve with ghost preview */}
            <div className={`${cardCls} px-[22px] py-5 flex flex-col gap-3.5`}>
                <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col gap-[5px]">
                        <h2 className={h2Cls}>Equity curve</h2>
                        <span className="font-mono text-[10.5px] font-medium tracking-[0.14em] text-[#5f6b70]">
                            NET LIQ ($) × TRADES LOGGED
                        </span>
                    </div>
                    <span className="font-mono text-[10px] font-medium tracking-[0.12em] text-[#5f6b70] border border-dashed border-[#2b343a] rounded-md px-2.5 py-[5px]">
                        PREVIEW
                    </span>
                </div>
                <div className="relative">
                    <EquityChart ghost />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 pointer-events-none">
                        <span className={emptyKickerCls}>{"/// NO DATA YET"}</span>
                        <span className="text-xl font-semibold text-[#eef4f2]">
                            Your curve starts at trade #1
                        </span>
                        <span className="text-[13.5px] text-[#7e8d89] max-w-[340px] text-center">
                            The dotted line is what a journaled year can look like.
                        </span>
                        <button
                            type="button"
                            onClick={open}
                            className={`${ctaCls} pointer-events-auto mt-1.5 px-5`}
                        >
                            Log your first trade
                        </button>
                    </div>
                </div>
            </div>

            {/* empty trades + notes */}
            <div className="grid grid-cols-[1.9fr_1fr] gap-4 items-stretch">
                <div className={`${cardCls} px-[22px] py-5 flex flex-col gap-3.5`}>
                    <h2 className={h2Cls}>Recent trades</h2>
                    <div className={emptyBoxCls}>
                        <span className={emptyKickerCls}>{"/// EMPTY LEDGER"}</span>
                        <span className="text-[13.5px] text-[#7e8d89] text-center max-w-[300px]">
                            Every trade you log lands here — entry, exit, size, and R.
                        </span>
                        <button
                            type="button"
                            onClick={open}
                            className="mt-1.5 bg-transparent border border-[rgba(47,213,127,0.3)] rounded-lg px-4 py-[9px] text-[#2fd57f] font-semibold text-[12.5px] cursor-pointer transition-colors hover:bg-[rgba(47,213,127,0.08)] hover:border-[#2fd57f]"
                        >
                            + Log a trade
                        </button>
                    </div>
                </div>
                <div className={`${cardCls} px-[22px] py-5 flex flex-col gap-3.5`}>
                    <h2 className={h2Cls}>Journal notes</h2>
                    <div className={emptyBoxCls}>
                        <span className={emptyKickerCls}>{"/// NO NOTES"}</span>
                        <span className="text-[13.5px] text-[#7e8d89] text-center max-w-[240px]">
                            The reasoning behind each trade — the part that makes you
                            better.
                        </span>
                    </div>
                </div>
            </div>

            {modal && <CreateAccountModal onClose={() => setModal(false)} />}
        </div>
    );
}
