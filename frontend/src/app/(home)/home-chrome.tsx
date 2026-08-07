import Link from "next/link";
import {
    BookOpenCheck,
    CalendarDays,
    ChartNoAxesCombined,
    LayoutDashboard,
    ListOrdered,
    NotebookPen,
    PlayCircle,
    UserPlus,
} from "lucide-react";

import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

const GETTING_STARTED = [
    {
        title: "View live demo",
        description: "Explore a populated trading journal without creating an account.",
        href: "/demo",
        icon: PlayCircle,
    },
    {
        title: "Why journal trades",
        description: "See how structured review turns trading history into useful feedback.",
        href: "#ai",
        icon: BookOpenCheck,
    },
    {
        title: "Create your workspace",
        description: "Start tracking your own trades, notes, and performance.",
        href: "/register",
        icon: UserPlus,
    },
] as const;

const PLATFORM = [
    { title: "Dashboard", description: "Account performance at a glance.", href: "/dashboard", icon: LayoutDashboard },
    { title: "Trade log", description: "Filter and review every execution.", href: "/dashboard/trades", icon: ListOrdered },
    { title: "Analytics", description: "Find patterns across symbols and setups.", href: "/dashboard/analytics", icon: ChartNoAxesCombined },
    { title: "Calendar", description: "Inspect daily and monthly P&L.", href: "/dashboard/calendar", icon: CalendarDays },
    { title: "Journal", description: "Keep the context behind every trade.", href: "/dashboard/journal", icon: NotebookPen },
] as const;

const menuLinkClass =
    "grid w-full grid-cols-[20px_1fr] items-start gap-x-3 gap-y-1 rounded-md p-3.5 text-white hover:bg-white/10 focus:bg-white/10";

const menuTitleClass =
    "font-sans text-[0.875em] font-normal leading-none text-white";

const menuDescriptionClass =
    "col-start-2 font-sans text-[0.875em] font-normal leading-[1.35] text-white/60";

const navigationLabelClass =
    "!h-10 !px-3 font-sans !text-[0.9375rem] !font-normal !leading-none";

export function HomeNav() {
    return (
        <nav className="nav-w" theme="light" aria-label="Primary">
            <div className="nav-inner relative !grid !grid-cols-[1fr_auto_1fr] !items-center">
                <Link
                    aria-current="page"
                    aria-label="homepage"
                    className="nav-logo w-inline-block w--current justify-self-start"
                    data-nav-logo=""
                    href="/"
                >
                    <span className="tradel-logo tradel-logo--nav" aria-label="Tradel">
                        tradel
                    </span>
                </Link>

                <NavigationMenu
                    render={<div />}
                    className="pointer-events-auto justify-self-center text-white max-[900px]:hidden"
                    popupClassName="border border-white/10 bg-black/65 font-sans text-white shadow-[0_14px_36px_rgba(0,0,0,0.3)] ring-0 backdrop-blur-md"
                >
                    <NavigationMenuList className="h-10 gap-1.5">
                        <NavigationMenuItem>
                            <NavigationMenuTrigger className={navigationLabelClass} data-nav-item="">
                                Getting Started
                            </NavigationMenuTrigger>
                            <NavigationMenuContent className="w-[430px] p-2">
                                <ul className="m-0 grid list-none gap-1 p-0">
                                    {GETTING_STARTED.map((item) => (
                                        <li key={item.title}>
                                            <NavigationMenuLink
                                                render={<Link href={item.href} />}
                                                className={menuLinkClass}
                                                closeOnClick
                                            >
                                                <item.icon className="mt-0.5 size-4 text-primary" aria-hidden="true" />
                                                <span className={menuTitleClass}>
                                                    {item.title}
                                                </span>
                                                <span className={menuDescriptionClass}>
                                                    {item.description}
                                                </span>
                                            </NavigationMenuLink>
                                        </li>
                                    ))}
                                </ul>
                            </NavigationMenuContent>
                        </NavigationMenuItem>

                        <NavigationMenuItem>
                            <NavigationMenuTrigger className={navigationLabelClass} data-nav-item="">
                                Platform
                            </NavigationMenuTrigger>
                            <NavigationMenuContent className="w-[540px] p-2">
                                <ul className="m-0 grid list-none grid-cols-2 gap-1 p-0">
                                    {PLATFORM.map((item) => (
                                        <li key={item.title}>
                                            <NavigationMenuLink
                                                render={<Link href={item.href} />}
                                                className={menuLinkClass}
                                                closeOnClick
                                            >
                                                <item.icon className="mt-0.5 size-4 text-primary" aria-hidden="true" />
                                                <span className={menuTitleClass}>
                                                    {item.title}
                                                </span>
                                                <span className={menuDescriptionClass}>
                                                    {item.description}
                                                </span>
                                            </NavigationMenuLink>
                                        </li>
                                    ))}
                                </ul>
                            </NavigationMenuContent>
                        </NavigationMenuItem>

                        <NavigationMenuItem>
                            <NavigationMenuLink
                                render={<Link href="#agent" />}
                                className={`text-white hover:bg-muted focus:bg-muted ${navigationLabelClass}`}
                                data-nav-item=""
                                closeOnClick
                            >
                                Why Tradel
                            </NavigationMenuLink>
                        </NavigationMenuItem>
                    </NavigationMenuList>
                </NavigationMenu>

                <div className="nav-content !h-10 justify-self-end">
                    <div className="nav-buttons !h-10">
                        <Link
                            className="nav-link new-button_label !m-0 !h-10 !px-3 !text-[0.9375rem] !leading-none"
                            data-nav-item=""
                            href="/login"
                        >
                            Log in
                        </Link>
                        <Link
                            className="new-button w-inline-block !h-10 !min-h-10 !max-h-10 !px-5"
                            data-nav-item=""
                            href="/register"
                        >
                            <span className="new-button_label !text-[0.9375rem] !leading-none">
                                Create account
                            </span>
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}
