'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Heart } from 'lucide-react';

import { Button } from '@/components/ui/button';
import tradelLockup from '../../../public/brand/tradel-lockup-4k.png';

if (typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
}

const FOOTER_STYLES = `
.cinematic-footer {
  contain: layout paint;
  -webkit-font-smoothing: antialiased;
  font-family: var(--font-sora), ui-sans-serif, system-ui, sans-serif;
  isolation: isolate;
  --pill-bg-1: color-mix(in oklch, var(--foreground) 5%, transparent);
  --pill-bg-2: color-mix(in oklch, var(--foreground) 1%, transparent);
  --pill-shadow: color-mix(in oklch, var(--background) 55%, transparent);
  --pill-highlight: color-mix(in oklch, var(--foreground) 12%, transparent);
  --pill-inset-shadow: color-mix(in oklch, var(--background) 80%, transparent);
  --pill-border: color-mix(in oklch, var(--foreground) 10%, transparent);
}

.cinematic-footer__grid {
  background-image:
    linear-gradient(to right, color-mix(in oklch, var(--foreground) 4%, transparent) 1px, transparent 1px),
    linear-gradient(to bottom, color-mix(in oklch, var(--foreground) 4%, transparent) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: linear-gradient(to bottom, transparent, black 28%, black 72%, transparent);
  -webkit-mask-image: linear-gradient(to bottom, transparent, black 28%, black 72%, transparent);
}

.cinematic-footer__pill {
  background: linear-gradient(145deg, var(--pill-bg-1), var(--pill-bg-2));
  border: 1px solid var(--pill-border);
  box-shadow:
    0 10px 30px -10px var(--pill-shadow),
    inset 0 1px 1px var(--pill-highlight),
    inset 0 -1px 2px var(--pill-inset-shadow);
}

.cinematic-footer__giant-logo {
  aspect-ratio: 4.22 / 1;
  background: linear-gradient(
    180deg,
    color-mix(in oklch, var(--foreground) 17%, transparent) 0%,
    color-mix(in oklch, var(--foreground) 12%, transparent) 42%,
    color-mix(in oklch, var(--foreground) 5%, transparent) 72%,
    transparent 100%
  );
  bottom: -2vh;
  filter:
    drop-shadow(1px 0 color-mix(in oklch, var(--foreground) 7%, transparent))
    drop-shadow(-1px 0 color-mix(in oklch, var(--foreground) 7%, transparent))
    drop-shadow(0 1px color-mix(in oklch, var(--foreground) 7%, transparent))
    drop-shadow(0 -1px color-mix(in oklch, var(--foreground) 7%, transparent));
  width: min(100vw, 120rem);
}

.cinematic-footer__heading {
  background: linear-gradient(180deg, var(--foreground), color-mix(in oklch, var(--foreground) 42%, transparent));
  background-clip: text;
  color: transparent;
  -webkit-background-clip: text;
}

`;

const FOOTER_LINK_CLASS =
    'nav-link m-0 rounded-none border-0 bg-transparent text-white hover:bg-transparent hover:text-white';

export function CinematicFooter() {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const giantLogoRef = useRef<HTMLDivElement>(null);
    const headingRef = useRef<HTMLHeadingElement>(null);
    const linksRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const wrapper = wrapperRef.current;
        const giantLogo = giantLogoRef.current;
        const heading = headingRef.current;
        const links = linksRef.current;
        if (!wrapper || !giantLogo || !heading || !links) return;

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduceMotion) {
            gsap.set([giantLogo, heading, links], { clearProps: 'all' });
            return;
        }

        const context = gsap.context(() => {
            gsap.timeline({
                scrollTrigger: {
                    start: 'top 88%',
                    toggleActions: 'play none none reverse',
                    trigger: wrapper,
                },
            })
                .fromTo(
                    giantLogo,
                    { opacity: 0, y: 70 },
                    {
                        duration: 1,
                        ease: 'power3.out',
                        force3D: true,
                        opacity: 1,
                        y: 0,
                    },
                    0,
                )
                .fromTo(
                    [heading, links],
                    { opacity: 0, y: 36 },
                    {
                        duration: 0.75,
                        ease: 'power3.out',
                        force3D: true,
                        opacity: 1,
                        stagger: 0.1,
                        y: 0,
                    },
                    0.08,
                );
        }, wrapper);

        return () => context.revert();
    }, []);

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: FOOTER_STYLES }} />
            <div
                className="relative h-[100svh] w-full overflow-hidden"
                id="site-footer"
                ref={wrapperRef}
            >
                <footer className="cinematic-footer relative flex h-full w-full flex-col justify-between overflow-hidden bg-background text-foreground">
                    <div className="cinematic-footer__grid pointer-events-none absolute inset-0 z-0" />

                    <div
                        aria-hidden="true"
                        className="cinematic-footer__giant-logo pointer-events-none absolute left-1/2 z-0 -translate-x-1/2 select-none"
                        ref={giantLogoRef}
                        style={{
                            maskImage: `url(${tradelLockup.src})`,
                            maskPosition: 'center',
                            maskRepeat: 'no-repeat',
                            maskSize: '100% auto',
                            WebkitMaskImage: `url(${tradelLockup.src})`,
                            WebkitMaskPosition: 'center',
                            WebkitMaskRepeat: 'no-repeat',
                            WebkitMaskSize: '100% auto',
                        }}
                    />

                    <div className="absolute inset-y-0 left-1/2 z-10 flex w-full max-w-5xl -translate-x-1/2 flex-col items-center justify-center px-5 pb-20 pt-14 md:px-6 md:pb-24">
                        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-primary md:text-sm">
                            Your next review starts here
                        </p>
                        <h2
                            className="cinematic-footer__heading mb-8 text-center text-4xl font-bold tracking-[-0.055em] sm:text-5xl md:mb-12 md:text-7xl lg:text-8xl"
                            ref={headingRef}
                        >
                            Trade with clarity.
                        </h2>

                        <nav
                            aria-label="Footer actions"
                            className="flex w-full flex-wrap justify-center gap-3 md:gap-4"
                            ref={linksRef}
                        >
                            <Button
                                className={FOOTER_LINK_CLASS}
                                data-nav-item=""
                                nativeButton={false}
                                render={<Link href="/register" />}
                                variant="ghost"
                            >
                                Log your first trade
                            </Button>
                            <Button
                                className={FOOTER_LINK_CLASS}
                                data-nav-item=""
                                nativeButton={false}
                                render={<Link href="/demo" />}
                                variant="ghost"
                            >
                                View live demo
                            </Button>
                        </nav>
                    </div>

                    <div className="absolute inset-x-0 bottom-0 z-20 flex w-full items-end px-5 pb-5 md:px-12 md:pb-8">
                        <p className="max-w-[9rem] text-[0.6rem] font-semibold uppercase leading-relaxed tracking-widest text-muted-foreground sm:max-w-none md:text-xs">
                            © 2026 Tradel. All rights reserved.
                        </p>

                        <div className="cinematic-footer__pill absolute left-1/2 hidden -translate-x-1/2 items-center gap-2 rounded-full px-5 py-3 sm:flex">
                            <span className="text-[0.625rem] font-bold uppercase tracking-widest text-muted-foreground md:text-xs">
                                Built with care
                            </span>
                            <Heart aria-hidden="true" className="size-3.5 fill-primary text-primary md:size-4" />
                            <span className="text-[0.625rem] font-bold uppercase tracking-widest text-muted-foreground md:text-xs">
                                for traders
                            </span>
                        </div>

                    </div>
                </footer>
            </div>
        </>
    );
}
