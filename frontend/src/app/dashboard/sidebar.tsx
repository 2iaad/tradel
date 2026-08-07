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
    MailIcon,
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
            >
                <Icon />
                <span>{item.title}</span>
            </SidebarMenuButton>
        </SidebarMenuItem>
    );
}

function MainNavigation() {
    return (
        <SidebarGroup>
            <SidebarGroupContent className="flex flex-col gap-4">
                <SidebarMenu>
                    <SidebarMenuItem className="flex items-center gap-2">
                        <SidebarMenuButton
                            render={<Link href="/dashboard/trades" />}
                            tooltip="Log trade"
                            size="lg"
                            className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
                        >
                            <CirclePlusIcon />
                            <span>Log trade</span>
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
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
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
        <SidebarGroup className="mt-auto">
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
                variant="outline"
                className="h-10 w-full justify-between bg-background px-3 text-left"
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
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton size="lg" className="h-12">
                    <Avatar className="size-8 rounded-lg grayscale">
                        <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-medium">{name}</span>
                        <span className="truncate text-xs text-foreground/70">{email}</span>
                    </div>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton
                    onClick={signOut}
                    tooltip={demo ? 'Exit demo' : 'Sign out'}
                    size="lg"
                >
                    <LogOutIcon />
                    <span>{demo ? 'Exit demo' : 'Sign out'}</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}

export function Sidebar() {
    const session = useSessionStore((state) => state.session);
    if (!hasDashboardSession(session)) return null;

    return (
        <ShadcnSidebar collapsible="offcanvas" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            render={<Link href="/dashboard" />}
                            size="lg"
                            className="data-[slot=sidebar-menu-button]:p-1.5!"
                        >
                            <CommandIcon className="size-5!" />
                            <span className="text-base font-semibold">Tradel</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <MainNavigation />
                <WorkspaceNavigation />
                <SecondaryNavigation />
            </SidebarContent>
            <SidebarFooter>
                <AccountPicker />
                <UserNavigation
                    email={session.email}
                    demo={session.status === 'demo'}
                />
            </SidebarFooter>
        </ShadcnSidebar>
    );
}
