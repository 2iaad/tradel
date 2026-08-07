'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    BarChart3Icon,
    BookOpenIcon,
    CalendarDaysIcon,
    CirclePlusIcon,
    CommandIcon,
    LayoutDashboardIcon,
    ListIcon,
    LogOutIcon,
    Settings2Icon,
    type LucideIcon,
} from 'lucide-react';

import { AccountModal } from './account-modal';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    Sidebar as ShadcnSidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useAccountStore } from '@/stores/accounts';
import { hasDashboardSession, useSessionStore } from '@/stores/session';

const NAV_MAIN = [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboardIcon },
    { title: 'Trades', url: '/dashboard/trades', icon: ListIcon },
    { title: 'Analytics', url: '/dashboard/analytics', icon: BarChart3Icon },
    { title: 'Calendar', url: '/dashboard/calendar', icon: CalendarDaysIcon },
] as const;

const NAV_WORKSPACE = [
    { title: 'Journal', url: '/dashboard/journal', icon: BookOpenIcon },
] as const;

const NAV_SECONDARY = [
    { title: 'Settings', url: '/dashboard/settings', icon: Settings2Icon },
] as const;

function NavLink({ item }: { item: { title: string; url: string; icon: LucideIcon } }) {
    const pathname = usePathname();
    const active =
        pathname === item.url || (item.url !== '/dashboard' && pathname.startsWith(`${item.url}/`));
    const Icon = item.icon;

    return (
        <SidebarMenuItem>
            <SidebarMenuButton
                render={<Link href={item.url} />}
                tooltip={item.title}
                isActive={active}
                size="lg"
                className="relative px-3 text-sidebar-foreground/70 hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground data-active:bg-primary/10 data-active:text-sidebar-accent-foreground data-active:shadow-[inset_3px_0_0_var(--sidebar-primary)] data-active:[&_svg]:text-primary group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:data-active:shadow-none [&_svg]:text-sidebar-foreground/45"
            >
                <Icon />
                <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
            </SidebarMenuButton>
        </SidebarMenuItem>
    );
}

function MainNavigation() {
    return (
        <SidebarGroup>
            <SidebarGroupContent className="flex flex-col gap-4">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            render={<Link href="/dashboard/trades" />}
                            tooltip="Log trade"
                            size="lg"
                            className="border border-primary/25 bg-primary/10 px-3 text-primary shadow-[inset_0_1px_0_rgb(255_255_255/0.04)] duration-200 hover:border-primary/40 hover:bg-primary/15 hover:text-primary active:bg-primary/20 active:text-primary group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:border-transparent group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:shadow-none group-data-[collapsible=icon]:hover:border-transparent group-data-[collapsible=icon]:hover:bg-sidebar-accent"
                        >
                            <CirclePlusIcon />
                            <span className="group-data-[collapsible=icon]:hidden">Log trade</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
                <SidebarMenu>
                    {NAV_MAIN.map((item) => (
                        <NavLink key={item.title} item={item} />
                    ))}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    );
}

function WorkspaceNavigation() {
    return (
        <SidebarGroup>
            <SidebarGroupLabel className="px-3 text-[0.625rem] uppercase tracking-[0.18em]">
                Workspace
            </SidebarGroupLabel>
            <SidebarMenu>
                {NAV_WORKSPACE.map((item) => (
                    <NavLink key={item.title} item={item} />
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}

function SecondaryNavigation() {
    return (
        <SidebarGroup className="mt-auto border-t border-sidebar-border/70 pt-2">
            <SidebarGroupContent>
                <SidebarMenu>
                    {NAV_SECONDARY.map((item) => (
                        <NavLink key={item.title} item={item} />
                    ))}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    );
}

function AccountPicker() {
    const accounts = useAccountStore((state) => state.accounts);
    const activeId = useAccountStore((state) => state.activeId);
    const setActive = useAccountStore((state) => state.setActive);
    const [open, setOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const active = accounts.find((account) => account.id === activeId) ?? null;

    return (
        <div className="relative group-data-[collapsible=icon]:hidden">
            <Button
                type="button"
                onClick={() => setOpen((value) => !value)}
                aria-expanded={open}
                variant="outline"
                className="h-10 w-full justify-between border-sidebar-border bg-sidebar-accent/45 px-3 text-left text-sidebar-foreground shadow-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
                <span className="min-w-0 truncate">{active?.name ?? 'No account'}</span>
                <span className="text-muted-foreground">▾</span>
            </Button>
            {open && (
                <div className="absolute bottom-full left-0 right-0 z-40 mb-1.5 flex flex-col gap-0.5 rounded-lg border bg-popover p-1.5 text-popover-foreground shadow-md">
                    {accounts.map((account) => (
                        <Button
                            key={account.id}
                            type="button"
                            onClick={() => {
                                setActive(account.id);
                                setOpen(false);
                            }}
                            variant="ghost"
                            className="h-8 w-full justify-between px-2.5 text-left"
                        >
                            <span className="truncate">{account.name}</span>
                            {account.id === activeId && <span className="text-primary">●</span>}
                        </Button>
                    ))}
                    <Button
                        type="button"
                        onClick={() => {
                            setCreating(true);
                            setOpen(false);
                        }}
                        variant="ghost"
                        className="h-8 justify-start border-t px-2.5 text-primary"
                    >
                        + New account
                    </Button>
                </div>
            )}
            {creating && <AccountModal account={null} onClose={() => setCreating(false)} />}
        </div>
    );
}

function UserNavigation({ email, demo }: { email: string; demo: boolean }) {
    const router = useRouter();
    const signOutStore = useSessionStore((state) => state.signOut);
    const name = demo ? 'Demo Trader' : email.split('@')[0];
    const initials = email.slice(0, 2).toUpperCase();

    const signOut = async () => {
        await signOutStore();
        router.push(demo ? '/' : '/login');
    };

    return (
        <div
            title={`${name} · ${email}`}
            className="flex h-14 items-center gap-2 rounded-lg border border-sidebar-border/70 bg-sidebar-accent/35 p-2 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0"
        >
            <Avatar className="size-8 rounded-md">
                <AvatarFallback className="rounded-md bg-primary/10 text-xs font-semibold text-primary">
                    {initials}
                </AvatarFallback>
            </Avatar>
            <div className="grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-medium text-sidebar-foreground">{name}</span>
                <span className="truncate text-xs text-sidebar-foreground/50">{email}</span>
            </div>
            <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                title={demo ? 'Exit demo' : 'Sign out'}
                className="text-sidebar-foreground/45 hover:bg-sidebar-accent hover:text-sidebar-foreground group-data-[collapsible=icon]:hidden"
                onClick={signOut}
            >
                <LogOutIcon />
                <span className="sr-only">{demo ? 'Exit demo' : 'Sign out'}</span>
            </Button>
        </div>
    );
}

export function Sidebar() {
    const session = useSessionStore((state) => state.session);
    if (!hasDashboardSession(session)) return null;

    return (
        <ShadcnSidebar collapsible="icon" variant="inset">
            <SidebarHeader className="p-3 pb-2 group-data-[collapsible=icon]:p-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            render={<Link href="/dashboard" />}
                            size="lg"
                            className="h-11 gap-3 p-0 hover:bg-transparent active:bg-transparent"
                        >
                            <span className="flex size-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]">
                                <CommandIcon className="size-4.5!" />
                            </span>
                            <span className="text-base font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
                                Tradel
                            </span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <MainNavigation />
                <WorkspaceNavigation />
                <SecondaryNavigation />
            </SidebarContent>
            <SidebarFooter className="gap-2.5 border-t border-sidebar-border/70 p-3 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:p-2">
                <AccountPicker />
                <UserNavigation
                    email={session.email}
                    demo={session.status === 'demo'}
                />
            </SidebarFooter>
        </ShadcnSidebar>
    );
}
