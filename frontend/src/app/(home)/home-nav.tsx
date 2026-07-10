'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const solidCls = 'border-[#14191d] bg-[rgba(7,9,11,0.82)] backdrop-blur-[14px]';
const signInCls =
    'rounded-lg px-4 py-[9px] text-[13.5px] font-medium text-[#93a09d] transition-colors hover:text-[#eef4f2]';
const getStartedCls =
    'rounded-lg bg-[#2fd57f] px-[18px] py-2.5 text-[13.5px] font-semibold text-[#04130a] transition-[background-color,transform] hover:bg-[#4ce392] active:scale-[0.97]';

// Pulsing dot + wordmark.
function Brand() {
    return (
        <span className="flex items-center gap-2.5">
            <span className="h-[9px] w-[9px] rounded-full bg-[#2fd57f] [animation:tradelPulse_2.2s_ease-out_infinite]" />
            <span className="font-mono text-[13px] font-semibold tracking-[0.22em] text-[#e8efec]">
                TRADEL
            </span>
        </span>
    );
}

// Fixed top nav — transparent over the hero, frosted glass once scrolled.
export function HomeNav() {
    const [solid, setSolid] = useState(false);
    useEffect(() => {
        const on = () => setSolid(window.scrollY > 32);
        on();
        window.addEventListener('scroll', on, { passive: true });
        return () => window.removeEventListener('scroll', on);
    }, []);
    return (
        <nav
            className={`fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b px-[clamp(20px,4vw,48px)] transition-[background-color,border-color,backdrop-filter] duration-300 ${solid ? solidCls : 'border-transparent bg-transparent'}`}
        >
            <Brand />
            <span className="flex items-center gap-2.5">
                <Link href="/login" className={signInCls}>
                    Sign in
                </Link>
                <Link href="/register" className={getStartedCls}>
                    Get started
                </Link>
            </span>
        </nav>
    );
}
