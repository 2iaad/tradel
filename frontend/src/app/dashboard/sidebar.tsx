'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { useSessionStore } from '@/stores/session';

const NAV = [
    ['01', 'Dashboard', '/dashboard'],
    ['02', 'Journal', '/dashboard/journal'],
    ['03', 'Trades', '/dashboard/trades'],
    ['04', 'Analytics', '/dashboard/analytics'],
    ['05', 'Calendar', '/dashboard/calendar'],
    ['06', 'Settings', '/dashboard/settings'],
] as const;

const itemCls = 'flex items-center gap-3 w-full box-border rounded-lg px-3.5 py-2.5 text-[13.5px]';

// TRADEL wordmark with the pulsing dot.
function Logo() {
    return (
        <div className="flex items-center gap-2.5 px-2.5 pb-[26px]">
            <span className="w-[9px] h-[9px] rounded-full bg-[#2fd57f] animate-[tradelPulse_2.2s_ease-out_infinite]" />
            <span className="font-mono text-[13px] font-semibold tracking-[0.22em] text-[#e8efec]">
                TRADEL
            </span>
        </div>
    );
}

// Greyed-out nav row shown to guests for locked sections.
function LockedItem({ num, label }: { num: string; label: string }) {
    return (
        <button
            type="button"
            className={`${itemCls} justify-between border-none text-left bg-transparent text-[#93a09d] cursor-not-allowed opacity-50`}
        >
            <span className="flex items-center gap-3">
                <span className="font-mono text-[10px] font-medium text-[#5f6b70]">{num}</span>
                {label}
            </span>
            <span className="font-mono text-[9px] font-medium text-[#5f6b70]">LOCKED</span>
        </button>
    );
}

type NavItem = (typeof NAV)[number];

const linkCls = (active: boolean) =>
    `${itemCls} ${
        active
            ? 'bg-[#10161a] shadow-[inset_2px_0_0_#2fd57f] text-[#eef4f2] font-medium'
            : 'text-[#93a09d] transition-colors hover:bg-[#0d1215] hover:text-[#c8d2d0]'
    }`;

// Nav row linking to a dashboard section; highlights the active route.
function NavLink({ item, active }: { item: NavItem; active: boolean }) {
    const [num, label, href] = item;
    return (
        <Link href={href} className={linkCls(active)}>
            <span
                className={`font-mono text-[10px] font-medium ${active ? 'text-[#2fd57f]' : 'text-[#5f6b70]'}`}
            >
                {num}
            </span>
            {label}
        </Link>
    );
}

// Section list; guests see the first five items with non-active ones locked.
function NavLinks({ guest }: { guest: boolean }) {
    const pathname = usePathname();
    // Guest sees the first five items; 02+ are locked (per design).
    const items = guest ? NAV.slice(0, 5) : NAV;

    return (
        <nav className="flex flex-col gap-0.5">
            {items.map((item) => {
                const [num, label, href] = item;
                const active = pathname === href;
                return guest && !active ? (
                    <LockedItem key={href} num={num} label={label} />
                ) : (
                    <NavLink key={href} item={item} active={active} />
                );
            })}
        </nav>
    );
}

// Round initials avatar; dashed style marks the guest placeholder.
function Avatar({ initials, dashed }: { initials: string; dashed: boolean }) {
    return (
        <span
            className={`flex items-center justify-center w-8 h-8 rounded-full bg-[#10161a] border font-mono text-xs font-semibold ${
                dashed
                    ? 'border-dashed border-[#2b343a] text-[#5f6b70]'
                    : 'border-[#222a2f] text-[#2fd57f] uppercase'
            }`}
        >
            {initials}
        </span>
    );
}

// Avatar + name/sub line at the bottom of the sidebar.
function UserBadge({
    initials,
    name,
    sub,
    dashed,
}: {
    initials: string;
    name: string;
    sub: string;
    dashed: boolean;
}) {
    return (
        <div className="flex items-center gap-2.5 px-2.5 py-3 border-t border-[#161c20]">
            <Avatar initials={initials} dashed={dashed} />
            <span className="flex flex-col gap-px min-w-0">
                <span
                    className={`text-[13px] font-medium ${dashed ? 'text-[#93a09d]' : 'text-[#e9eef0]'}`}
                >
                    {name}
                </span>
                <span className="font-mono text-[10.5px] text-[#5f6b70] overflow-hidden text-ellipsis">
                    {sub}
                </span>
            </span>
        </div>
    );
}

// Sign-out button (signed in) or sign-in link (guest).
function AuthAction({ signedIn }: { signedIn: boolean }) {
    const router = useRouter();
    const signOutStore = useSessionStore((s) => s.signOut);
    const signOut = async () => {
        await signOutStore();
        router.push('/dashboard');
    };

    return signedIn ? (
        <button
            type="button"
            onClick={signOut}
            className="block w-full text-center font-mono text-[11px] font-medium tracking-[0.12em] text-[#5f6b70] p-2 bg-transparent border border-[#1b2226] rounded-lg cursor-pointer transition-colors hover:text-[#f0554e] hover:border-[#f0554e44]"
        >
            SIGN OUT
        </button>
    ) : (
        <Link
            href="/login"
            className="block text-center font-mono text-[11px] font-medium tracking-[0.12em] text-[#2fd57f] no-underline p-[9px] border border-[rgba(47,213,127,0.3)] rounded-lg transition-colors hover:bg-[rgba(47,213,127,0.08)] hover:border-[#2fd57f]"
        >
            SIGN IN
        </Link>
    );
}

// Dashboard sidebar: logo, section nav, and the session footer.
export function Sidebar() {
    const session = useSessionStore((s) => s.session);
    const user = session.status === 'user';

    return (
        <aside className="sticky top-0 h-screen box-border flex-[0_0_232px] flex flex-col bg-[#07090b] border-r border-[#1b2226] pt-7 px-4 pb-5">
            <Logo />
            <NavLinks guest={session.status === 'guest'} />
            <div className="mt-auto flex flex-col gap-3">
                <UserBadge
                    initials={user ? session.email.slice(0, 2) : '?'}
                    name={user ? session.email.split('@')[0] : 'Guest'}
                    sub={user ? session.email : 'NOT SIGNED IN'}
                    dashed={!user}
                />
                <AuthAction signedIn={user} />
            </div>
        </aside>
    );
}
