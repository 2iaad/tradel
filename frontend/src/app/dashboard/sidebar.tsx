'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { useAccountStore } from '@/stores/accounts';
import { useSessionStore } from '@/stores/session';
import { AccountModal } from './account-modal';
import { Button } from '@/components/ui/button';
import { Avatar as ShadcnAvatar, AvatarFallback } from '@/components/ui/avatar';
import {
    Sidebar as ShadcnSidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';

const NAV = [
    ['Dashboard', '/dashboard', '/icons/sidebar/dashboard.png'],
    ['Trades', '/dashboard/trades', '/icons/sidebar/trades.png'],
    ['Analytics', '/dashboard/analytics', '/icons/sidebar/analytics.png'],
    ['Calendar', '/dashboard/calendar', '/icons/sidebar/calendar.png'],
    ['Journal', '/dashboard/journal', '/icons/sidebar/journal.png'],
    ['Settings', '/dashboard/settings', '/icons/sidebar/settings.png'],
] as const;

const itemCls = 'flex items-center my-0.5 w-full box-border rounded-lg px-8 py-5 text-ui-sm';

// TRADEL wordmark with the pulsing dot.
function Logo() {
    return (
        <div className="flex items-center gap-2.5 px-2.5 pb-[26px]">
            <span className="font-mono text-ui-sm font-semibold tracking-[0.22em] text-card-foreground">
                TRADEL
            </span>
        </div>
    );
}

type NavItem = (typeof NAV)[number];

const linkCls = (active: boolean) =>
    `${itemCls} ${
        active
            ? 'bg-accent shadow-[inset_2px_0_0_var(--primary)] text-card-foreground font-medium'
            : 'text-content-muted transition-colors hover:bg-surface-subtle hover:text-secondary-foreground'
    }`;

// Nav row linking to a dashboard section; highlights the active route.
function NavLink({ item, active }: { item: NavItem; active: boolean }) {
    const [label, href, icon] = item;
    return (
        <SidebarMenuItem>
            <SidebarMenuButton
                render={<Link href={href} />}
                isActive={active}
                className={linkCls(active)}
            >
                <Image
                    src={icon}
                    alt=""
                    width={20}
                    height={20}
                    aria-hidden="true"
                    draggable={false}
                    className={`size-5 shrink-0 object-contain transition-[filter,opacity] ${
                        active ? 'opacity-100' : 'grayscale opacity-60'
                    }`}
                />
                {label}
            </SidebarMenuButton>
        </SidebarMenuItem>
    );
}

// Section nav list, highlighting the active route.
function NavLinks() {
    const pathname = usePathname();

    return (
        <SidebarMenu>
            {NAV.map((item) => (
                <NavLink key={item[1]} item={item} active={pathname === item[1]} />
            ))}
        </SidebarMenu>
    );
}

// Round initials avatar.
function Avatar({ initials }: { initials: string }) {
    return (
        <ShadcnAvatar className="size-8 rounded-full border border-border bg-accent">
            <AvatarFallback className="bg-transparent font-mono text-ui-xs font-semibold text-primary uppercase">
                {initials}
            </AvatarFallback>
        </ShadcnAvatar>
    );
}

// Avatar + name/sub line at the bottom of the sidebar.
function UserBadge({ initials, name, sub }: { initials: string; name: string; sub: string }) {
    return (
        <div className="flex items-center gap-2.5 px-2.5 py-1">
            <Avatar initials={initials} />
            <span className="flex flex-col gap-px min-w-0">
                <span className="text-ui-sm font-medium text-content">{name}</span>
                <span className="font-mono text-ui-xs text-content-faint overflow-hidden text-ellipsis">
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
            <Button
                type="button"
                onClick={() => setOpen((o) => !o)}
                variant="outline"
                className="h-auto flex w-full items-center justify-between gap-2 rounded-lg border-border-subtle bg-muted px-3 py-2.5 text-left hover:bg-muted hover:border-border-hover"
            >
                <span className="flex flex-col items-start gap-0.5 min-w-0">
                    <span className="font-mono text-ui-xs font-medium tracking-[0.16em] text-content-faint">
                        ACCOUNT
                    </span>
                    <span className="text-ui-sm font-medium text-content truncate max-w-[150px]">
                        {active ? active.name : 'No account'}
                    </span>
                </span>
                <span className="font-mono text-ui-xs text-content-faint">▾</span>
            </Button>
            {open && (
                <div className="absolute bottom-full left-0 right-0 mb-1.5 bg-card border border-border rounded-lg p-1.5 flex flex-col gap-0.5 shadow-[0_8px_28px_rgba(0,0,0,0.5)] z-40">
                    {accounts.map((a) => (
                        <Button
                            key={a.id}
                            type="button"
                            onClick={() => {
                                setActive(a.id);
                                setOpen(false);
                            }}
                            variant="ghost"
                            className={`h-auto flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-ui-sm text-left transition-colors ${
                                a.id === activeId
                                    ? 'bg-accent text-card-foreground'
                                    : 'bg-transparent text-content-muted hover:bg-surface-subtle hover:text-secondary-foreground'
                            }`}
                        >
                            <span className="truncate">{a.name}</span>
                            {a.id === activeId && (
                                <span className="text-primary text-ui-xs">●</span>
                            )}
                        </Button>
                    ))}
                    <Button
                        type="button"
                        onClick={() => {
                            setCreating(true);
                            setOpen(false);
                        }}
                        variant="ghost"
                        className="h-auto mt-0.5 rounded-md border-t border-border-faint bg-transparent px-2.5 py-2 text-left font-mono text-ui-sm font-medium tracking-[0.1em] text-primary hover:bg-surface-subtle"
                    >
                        + NEW ACCOUNT
                    </Button>
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
        <Button
            type="button"
            onClick={signOut}
            variant="outline"
            className="h-auto block w-full border-border-subtle bg-transparent p-2 text-center font-mono text-ui-sm font-medium tracking-[0.12em] text-content-faint hover:bg-transparent hover:text-loss hover:border-loss/25"
        >
            SIGN OUT
        </Button>
    );
}

// Dashboard sidebar: logo, section nav, and the session footer.
export function Sidebar() {
    const session = useSessionStore((s) => s.session);
    // Only signed-in users reach the dashboard; render nothing otherwise.
    if (session.status !== 'user') return null;

    return (
        <ShadcnSidebar
            collapsible="offcanvas"
            className="border-border-subtle bg-sidebar text-content"
        >
            <SidebarHeader className="gap-0 p-4 pt-7">
                <Logo />
                <Button
                    nativeButton={false}
                    render={<Link href="/dashboard/trades" />}
                    className="h-auto rounded-lg bg-primary px-3.5 py-2.5 text-ui-sm font-semibold text-primary-foreground hover:bg-primary-hover"
                >
                    + Log trade
                </Button>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup className="px-4 py-0">
                    <NavLinks />
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="gap-4 border-t border-border-faint p-4">
                <AccountPicker />
                <UserBadge
                    initials={session.email.slice(0, 2)}
                    name={session.email.split('@')[0]}
                    sub={session.email}
                />
                <AuthAction />
            </SidebarFooter>
        </ShadcnSidebar>
    );
}
