import Link from 'next/link';
import { Tape, TOP_TICKS } from '@/components/tape';
import { kickerCls } from '@/lib/ui';
import { MaskedHeading } from './masked-heading';

const h2Cls =
    'm-0 text-[clamp(44px,6vw,88px)] leading-[1.06] font-semibold tracking-[-0.03em] text-[#eef4f1]';
const cursorCls =
    'ml-[0.12em] inline-block h-[0.7em] w-[0.13em] align-[-0.03em] bg-[#2fd57f] [animation:tradelBlink_1.1s_steps(1)_infinite]';
const ctaCls =
    'inline-flex items-center rounded-[9px] bg-[#2fd57f] px-8 py-4 text-base font-semibold text-[#04130a] shadow-[0_8px_32px_rgba(47,213,127,0.25)] transition-[background-color,transform,box-shadow] hover:bg-[#4ce392] hover:shadow-[0_10px_40px_rgba(47,213,127,0.35)] active:scale-[0.97]';
const footLinkCls =
    'font-mono text-[10.5px] font-medium tracking-[0.14em] text-[#5f6b70] transition-colors hover:text-[#c8d2d0]';

// "Already journaling? Sign in" footer line under the CTA.
function SignInLine() {
    return (
        <div data-reveal="up" data-reveal-delay="640" className="text-[13px] text-[#5f6b70]">
            Already journaling?{' '}
            <Link href="/login" className="font-medium text-[#2fd57f] hover:text-[#5fe9a0]">
                Sign in
            </Link>
        </div>
    );
}

// Closing masked headline with the blinking cursor and the final CTAs.
function CtaBlock() {
    return (
        <div className="box-border flex flex-1 flex-col items-center justify-center gap-7 px-6 pt-[110px] pb-20 text-center">
            <MaskedHeading
                className={h2Cls}
                delays={[140, 300]}
                lines={[
                    'Your next trade',
                    <>
                        deserves a record.
                        <span className={cursorCls} />
                    </>,
                ]}
            />
            <div data-reveal="up" data-reveal-delay="520">
                <Link href="/register" className={ctaCls}>
                    Create your free account
                </Link>
            </div>
            <SignInLine />
        </div>
    );
}

// Brand line, footer links and the scrolling ticker tape.
function HomeFooter() {
    return (
        <div className="border-t border-[#14191d]">
            <div className="mx-auto box-border flex max-w-[1180px] flex-wrap items-center justify-between gap-4 px-9 py-[22px]">
                <div className="flex items-center gap-2.5">
                    <span className="h-[7px] w-[7px] rounded-full bg-[#2fd57f]" />
                    <span className="font-mono text-[11px] font-semibold tracking-[0.2em] text-[#7e8d89]">
                        TRADEL &copy; 2026
                    </span>
                </div>
                <div className="flex gap-[22px]">
                    <Link href="/login" className={footLinkCls}>
                        SIGN IN
                    </Link>
                    <Link href="/dashboard" className={footLinkCls}>
                        DEMO
                    </Link>
                </div>
            </div>
            <Tape items={TOP_TICKS} duration="52s" className="h-[42px] border-t border-[#14191d]" />
        </div>
    );
}

// 05 · CTA + footer — the closing full-height movement.
export function CtaSection() {
    return (
        <section className="relative flex min-h-screen flex-col overflow-hidden border-t border-[#14191d] bg-[#07090b]">
            <CtaBlock />
            <HomeFooter />
        </section>
    );
}
