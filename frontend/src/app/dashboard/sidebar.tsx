'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { useAccountStore } from '@/stores/accounts';
import { useSessionStore } from '@/stores/session';
import { AccountModal } from './account-modal';

const NAV = [
    ['Dashboard', '/dashboard'],
    ['Trades', '/dashboard/trades'],
    ['Analytics', '/dashboard/analytics'],
    ['Calendar', '/dashboard/calendar'],
    ['Journal', '/dashboard/journal'],
    ['Settings', '/dashboard/settings'],
] as const;

const itemCls = 'flex items-center gap-3 w-full box-border rounded-lg px-3.5 py-2.5 text-[13.5px]';

// TRADEL wordmark with the pulsing dot.
function Logo() {
    return (
        <div className="flex items-center gap-2.5 px-2.5 pb-[26px]">
            <span className="font-mono text-[13px] font-semibold tracking-[0.22em] text-[#e8efec]">
                TRADEL
            </span>
        </div>
    );
}

type NavItem = (typeof NAV)[number];

const linkCls = (active: boolean) =>
    `${itemCls} ${
        active
            ? 'bg-[#10161a] shadow-[inset_2px_0_0_#2fd57f] text-[#eef4f2 font-medium'
            : 'text-[#93a09d] transition-colors hover:bg-[#0d1215] hover:text-[#c8d2d0]'
    }`;

// Nav row linking to a dashboard section; highlights the active route.
function NavLink({ item, active }: { item: NavItem; active: boolean }) {
    const [label, href] = item;
    return (
        <Link href={href} className={linkCls(active)}>
            {label}
        </Link>
    );
}

// Section nav list, highlighting the active route.
function NavLinks() {
    const pathname = usePathname();

    return (
        <nav className="flex flex-col gap-0.5">
            {NAV.map((item) => (
                <NavLink key={item[1]} item={item} active={pathname === item[1]} />
            ))}
        </nav>
    );
}

// Round initials avatar.
function Avatar({ initials }: { initials: string }) {
    return (
        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#10161a] border border-[#222a2f] font-mono text-xs font-semibold text-[#2fd57f] uppercase">
            {initials}
        </span>
    );
}

// Avatar + name/sub line at the bottom of the sidebar.
function UserBadge({ initials, name, sub }: { initials: string; name: string; sub: string }) {
    return (
        <div className="flex items-center gap-2.5 px-2.5 py-3 border-t border-[#161c20]">
            <Avatar initials={initials} />
            <span className="flex flex-col gap-px min-w-0">
                <span className="text-[13px] font-medium text-[#e9eef0]">{name}</span>
                <span className="font-mono text-[10.5px] text-[#5f6b70] overflow-hidden text-ellipsis">
                    {sub}
                </span>
            </span>
        </div>
    );
}

// Account switcher: active account button that expands to the account list +
// "new account". Switching an account cascades into the trades/notes stores.
function AccountPicker() {
    const accounts = useAccountStore((s) => s.accounts);
    const activeId = useAccountStore((s) => s.activeId);
    const setActive = useAccountStore((s) => s.setActive);
    const [open, setOpen] = useState(false);
    const [creating, setCreating] = useState(false);

    const active = accounts.find((a) => a.id === activeId) ?? null;

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="flex items-center justify-between gap-2 w-full box-border rounded-lg px-3 py-2.5 bg-[#0a0d0f] border border-[#1b2226] cursor-pointer transition-colors hover:border-[#2b353b]"
            >
                <span className="flex flex-col items-start gap-0.5 min-w-0">
                    <span className="font-mono text-[9px] font-medium tracking-[0.16em] text-[#5f6b70]">
                        ACCOUNT
                    </span>
                    <span className="text-[13px] font-medium text-[#e9eef0] truncate max-w-[150px]">
                        {active ? active.name : 'No account'}
                    </span>
                </span>
                <span className="font-mono text-[10px] text-[#5f6b70]">▾</span>
            </button>
            {open && (
                <div className="absolute bottom-full left-0 right-0 mb-1.5 bg-[#0e1214] border border-[#222a2f] rounded-lg p-1.5 flex flex-col gap-0.5 shadow-[0_8px_28px_rgba(0,0,0,0.5)] z-40">
                    {accounts.map((a) => (
                        <button
                            key={a.id}
                            type="button"
                            onClick={() => {
                                setActive(a.id);
                                setOpen(false);
                            }}
                            className={`flex items-center justify-between gap-2 rounded-md px-2.5 py-2 text-[13px] text-left cursor-pointer border-none transition-colors ${
                                a.id === activeId
                                    ? 'bg-[#10161a] text-[#eef4f2]'
                                    : 'bg-transparent text-[#93a09d] hover:bg-[#0d1215] hover:text-[#c8d2d0]'
                            }`}
                        >
                            <span className="truncate">{a.name}</span>
                            {a.id === activeId && (
                                <span className="text-[#2fd57f] text-[11px]">●</span>
                            )}
                        </button>
                    ))}
                    <button
                        type="button"
                        onClick={() => {
                            setCreating(true);
                            setOpen(false);
                        }}
                        className="rounded-md px-2.5 py-2 mt-0.5 border-t border-[#161c20] bg-transparent font-mono text-[11px] font-medium tracking-[0.1em] text-[#2fd57f] text-left cursor-pointer hover:bg-[#0d1215]"
                    >
                        + NEW ACCOUNT
                    </button>
                </div>
            )}
            {creating && <AccountModal account={null} onClose={() => setCreating(false)} />}
        </div>
    );
}

// Sign-out button.
function AuthAction() {
    const router = useRouter();
    const signOutStore = useSessionStore((s) => s.signOut);
    const signOut = async () => {
        await signOutStore();
        router.push('/login');
    };

    return (
        <button
            type="button"
            onClick={signOut}
            className="block w-full text-center font-mono text-[11px] font-medium tracking-[0.12em] text-[#5f6b70] p-2 bg-transparent border border-[#1b2226] rounded-lg cursor-pointer transition-colors hover:text-[#f0554e] hover:border-[#f0554e44]"
        >
            SIGN OUT
        </button>
    );
}

// Dashboard sidebar: logo, section nav, and the session footer.
export function Sidebar() {
    const session = useSessionStore((s) => s.session);
    // Only signed-in users reach the dashboard; render nothing otherwise.
    if (session.status !== 'user') return null;

    return (
        <aside className="sticky top-0 h-screen w-1/8 box-border flex flex-col bg-[#07090b] border-r border-[#1b2226] pt-7 px-4 pb-5">
            <Logo />
            <NavLinks />
            <div className="mt-auto flex flex-col gap-6">
                <AccountPicker />
                <UserBadge
                    initials={session.email.slice(0, 2)}
                    name={session.email.split('@')[0]}
                    sub={session.email}
                />
                <AuthAction />
            </div>
        </aside>
    );
}
