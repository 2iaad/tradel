"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Tape, TOP_TICKS } from "@/components/tape";
import { logout, restoreSession } from "@/lib/api";
import { Session, SessionContext } from "./session";

const NAV = [
    ["01", "Dashboard", "/dashboard"],
    ["02", "Journal", "/dashboard/journal"],
    ["03", "Trades", "/dashboard/trades"],
    ["04", "Analytics", "/dashboard/analytics"],
    ["05", "Calendar", "/dashboard/calendar"],
    ["06", "Settings", "/dashboard/settings"],
] as const;

const itemCls =
    "flex items-center gap-3 w-full box-border rounded-lg px-3.5 py-2.5 text-[13.5px]";

// JWT payload is { sub, email } — base64url-decode the middle segment.
function emailFromToken(token: string): string | null {
    try {
        const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
        return JSON.parse(atob(b64)).email ?? null;
    } catch {
        return null;
    }
}

function Sidebar({ session }: { session: Session }) {
    const pathname = usePathname();
    const router = useRouter();
    const guest = session.status === "guest";
    // Guest sees the first five items; 02+ are locked (per design).
    const items = guest ? NAV.slice(0, 5) : NAV;

    return (
        <aside className="sticky top-0 h-screen box-border flex-[0_0_232px] flex flex-col bg-[#07090b] border-r border-[#1b2226] pt-7 px-4 pb-5">
            <div className="flex items-center gap-2.5 px-2.5 pb-[26px]">
                <span className="w-[9px] h-[9px] rounded-full bg-[#2fd57f] animate-[tradelPulse_2.2s_ease-out_infinite]" />
                <span className="font-mono text-[13px] font-semibold tracking-[0.22em] text-[#e8efec]">
                    TRADEL
                </span>
            </div>

            <nav className="flex flex-col gap-0.5">
                {items.map(([num, label, href]) => {
                    const active = pathname === href;
                    if (guest && !active) {
                        return (
                            <button
                                key={href}
                                type="button"
                                className={`${itemCls} justify-between border-none text-left bg-transparent text-[#93a09d] cursor-not-allowed opacity-50`}
                            >
                                <span className="flex items-center gap-3">
                                    <span className="font-mono text-[10px] font-medium text-[#5f6b70]">
                                        {num}
                                    </span>
                                    {label}
                                </span>
                                <span className="font-mono text-[9px] font-medium text-[#5f6b70]">
                                    LOCKED
                                </span>
                            </button>
                        );
                    }
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`${itemCls} ${
                                active
                                    ? "bg-[#10161a] shadow-[inset_2px_0_0_#2fd57f] text-[#eef4f2] font-medium"
                                    : "text-[#93a09d] transition-colors hover:bg-[#0d1215] hover:text-[#c8d2d0]"
                            }`}
                        >
                            <span
                                className={`font-mono text-[10px] font-medium ${active ? "text-[#2fd57f]" : "text-[#5f6b70]"}`}
                            >
                                {num}
                            </span>
                            {label}
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto flex flex-col gap-3">
                <div className="flex items-center gap-2.5 px-2.5 py-3 border-t border-[#161c20]">
                    {session.status === "user" ? (
                        <>
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#10161a] border border-[#222a2f] text-[#2fd57f] font-mono text-xs font-semibold uppercase">
                                {session.email.slice(0, 2)}
                            </span>
                            <span className="flex flex-col gap-px min-w-0">
                                <span className="text-[13px] font-medium text-[#e9eef0]">
                                    {session.email.split("@")[0]}
                                </span>
                                <span className="font-mono text-[10.5px] text-[#5f6b70] overflow-hidden text-ellipsis">
                                    {session.email}
                                </span>
                            </span>
                        </>
                    ) : (
                        <>
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#10161a] border border-dashed border-[#2b343a] text-[#5f6b70] font-mono text-xs font-semibold">
                                ?
                            </span>
                            <span className="flex flex-col gap-px min-w-0">
                                <span className="text-[13px] font-medium text-[#93a09d]">
                                    Guest
                                </span>
                                <span className="font-mono text-[10.5px] text-[#5f6b70]">
                                    NOT SIGNED IN
                                </span>
                            </span>
                        </>
                    )}
                </div>
                {session.status === "user" ? (
                    <button
                        type="button"
                        onClick={async () => {
                            await logout();
                            router.push("/");
                        }}
                        className="block w-full text-center font-mono text-[11px] font-medium tracking-[0.12em] text-[#5f6b70] p-2 bg-transparent border border-[#1b2226] rounded-lg cursor-pointer transition-colors hover:text-[#f0554e] hover:border-[#f0554e44]"
                    >
                        SIGN OUT
                    </button>
                ) : (
                    <Link
                        href="/"
                        className="block text-center font-mono text-[11px] font-medium tracking-[0.12em] text-[#2fd57f] no-underline p-[9px] border border-[rgba(47,213,127,0.3)] rounded-lg transition-colors hover:bg-[rgba(47,213,127,0.08)] hover:border-[#2fd57f]"
                    >
                        SIGN IN
                    </Link>
                )}
            </div>
        </aside>
    );
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [session, setSession] = useState<Session>({
        status: "checking",
        email: null,
    });

    useEffect(() => {
        restoreSession().then((token) => {
            const email = token && emailFromToken(token);
            setSession(
                email
                    ? { status: "user", email }
                    : { status: "guest", email: null },
            );
        });
    }, []);

    return (
        <div className="flex min-h-screen bg-[#0b0e10]">
            <Sidebar session={session} />
            <main className="flex-1 min-w-0 flex flex-col">
                <Tape
                    items={TOP_TICKS}
                    duration="46s"
                    className="h-10 border-b border-[#1b2226] flex-none"
                />
                <SessionContext.Provider value={session}>
                    {session.status !== "checking" && children}
                </SessionContext.Provider>
            </main>
        </div>
    );
}
