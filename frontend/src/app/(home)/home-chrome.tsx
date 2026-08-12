import Image from "next/image";
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
import { Button } from "@/components/ui/button";
import tradelIcon from "../../../public/tradel-icon.png";

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
    "h-10 px-5 font-sans text-ui-md font-medium leading-none";

export function HomeNav() {
    return (
        <nav className="nav-w" theme="light" aria-label="Primary">
            <div className="nav-inner relative flex h-20 items-center py-0">
                <div className="flex flex-1 items-center justify-start">
                    <Link
                        aria-current="page"
                        aria-label="homepage"
                        className="nav-logo w--current flex size-10 items-center justify-center"
                        data-nav-logo=""
                        href="/"
                    >
                        <Image
                            src={tradelIcon}
                            alt="Tradel"
                            className="size-10 object-contain"
                            priority
                        />
                    </Link>
                </div>

                <NavigationMenu
                    render={<div />}
                    className="pointer-events-auto h-10 flex-none text-white max-[900px]:hidden"
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

                <div className="nav-content flex h-10 flex-1 items-center justify-end">
                    <div className="nav-buttons h-10">
                        <Button
                            nativeButton={false}
                            render={<Link href="/login" />}
                            variant="ghost"
                            className="nav-link m-0 text-white hover:bg-transparent hover:text-white"
                            data-nav-item=""
                        >
                            Log in
                        </Button>
                        <Button
                            nativeButton={false}
                            render={<Link href="/register" />}
                            variant="outline"
                            className="border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white dark:border-white/25 dark:bg-white/5 dark:hover:bg-white/10"
                            data-nav-item=""
                        >
                            Create account
                        </Button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
