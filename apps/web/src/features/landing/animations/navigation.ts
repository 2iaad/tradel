import Lenis from 'lenis';
import { gsap, ScrollTrigger } from './runtime';

let lenis: Lenis | null = null;

export function prepareAnchors() {
    const intro = document.querySelector<HTMLElement>('.section.is--intro');
    const lighthouse = document.querySelector<HTMLElement>('.section.is--lighthouse');
    const process = document
        .querySelector<HTMLElement>('.process-section')
        ?.closest<HTMLElement>('.section');
    const community = document
        .querySelector<HTMLElement>('.swiper.coverflow')
        ?.closest<HTMLElement>('section');
    const education = document
        .querySelector<HTMLElement>('.blog-toggle__link')
        ?.closest<HTMLElement>('section');
    const support = document
        .querySelector<HTMLElement>('[data-autoplay-section]')
        ?.closest<HTMLElement>('section');
    const download = document
        .querySelector<HTMLElement>('[data-download-w]')
        ?.closest<HTMLElement>('section');

    intro?.setAttribute('id', 'ai');
    lighthouse?.setAttribute('id', 'agent');
    process?.setAttribute('id', 'process');
    community?.setAttribute('id', 'community');
    education?.setAttribute('id', 'education');
    support?.setAttribute('id', 'support');
    download?.setAttribute('id', 'download');

    document.querySelector<HTMLElement>('.process-text.hide')?.classList.remove('hide');

    const navTargets: Record<string, string> = {
        ai: '#ai',
        blog: '#education',
        academy: '#education',
        earn: '#community',
    };

    document.querySelectorAll<HTMLAnchorElement>('.nav-link').forEach((link) => {
        const label = link.textContent?.trim().toLowerCase() ?? '';
        const target = navTargets[label];
        // Only rewrite in-page section links; leave real routes (/login) alone.
        if (target) link.href = target;
    });

    document.querySelectorAll<HTMLAnchorElement>('a').forEach((link) => {
        const label = link.textContent?.trim().toLowerCase() ?? '';

        if (label.includes('meet your agent') || label.includes('meet me today')) {
            link.href = '#process';
        } else if (label.includes('trade now')) {
            link.href = '#process';
        } else if (label.includes('all articles')) {
            link.href = '#education';
        } else if (label.includes('join us')) {
            link.href = '#community';
        } else if (label.includes('write to us')) {
            link.href = '#support';
        }
    });
}

export function setupSmoothScroll() {
    lenis = new Lenis({
        duration: 1.1,
        easing: (time: number) => (time === 1 ? 1 : 1 - Math.pow(2, -13 * time)),
        smoothWheel: true,
        syncTouch: false,
    });

    lenis.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => lenis?.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    document.addEventListener('click', (event) => {
        const target = event.target;
        if (!(target instanceof Element)) return;

        const anchor = target.closest<HTMLAnchorElement>('a[href^="#"]');
        if (!anchor) return;

        const href = anchor.getAttribute('href');
        if (!href || href === '#') {
            event.preventDefault();
            return;
        }

        const destination = document.querySelector<HTMLElement>(href);
        if (!destination) {
            event.preventDefault();
            return;
        }

        event.preventDefault();
        lenis?.scrollTo(destination, {
            duration: 1.1,
            offset: 0,
        });
    });
}

export function setupNavigation() {
    if (window.matchMedia('(min-width: 768px)').matches) {
        const items = Array.from(document.querySelectorAll<HTMLElement>('[data-nav-item]'));

        items.forEach((item) => {
            item.addEventListener('mouseenter', () => {
                items.forEach((candidate) => {
                    candidate.setAttribute('data-nav-item', candidate === item ? '' : 'faded');
                });
            });
            item.addEventListener('mouseleave', () => {
                items.forEach((candidate) => candidate.setAttribute('data-nav-item', ''));
            });
        });
    }

    const localeButton = document.querySelector<HTMLElement>('[data-locals]');
    const localeLists = Array.from(document.querySelectorAll<HTMLElement>('[data-locals-list]'));
    localeLists.forEach((list) => {
        list.style.display = 'none';
    });

    localeButton?.addEventListener('click', (event) => {
        event.stopPropagation();
        const shouldOpen = localeLists[0]?.style.display !== 'flex';
        localeLists.forEach((list) => {
            list.style.display = shouldOpen ? 'flex' : 'none';
        });
    });

    document.addEventListener('click', (event) => {
        const target = event.target;
        if (
            target instanceof Element &&
            !target.closest('[data-locals]') &&
            !target.closest('[data-locals-list]')
        ) {
            localeLists.forEach((list) => {
                list.style.display = 'none';
            });
        }
    });

    setupMobileMenu();
}

function setupMobileMenu() {
    const button = document.querySelector<HTMLElement>('.menu-btn');
    const menu = document.querySelector<HTMLElement>('.menu-w');
    if (!button || !menu) return;

    const lines = Array.from(button.querySelectorAll<HTMLElement>('.menu-btn__line'));
    const [topLine, middleLine, bottomLine] = lines;
    const menuLabels = menu.querySelectorAll<HTMLElement>('.menu-link__text');
    const menuButtons = menu.querySelectorAll<HTMLElement>('.menu-button');
    let isOpen = false;
    let isAnimating = false;

    menu.setAttribute('aria-hidden', 'true');
    gsap.set(menu, { display: 'none', height: '0dvh' });

    const open = () => {
        if (isOpen || isAnimating) return;
        isAnimating = true;
        isOpen = true;
        lenis?.stop();

        const timeline = gsap.timeline({
            defaults: { ease: 'main' },
            onComplete: () => {
                isAnimating = false;
                menu.setAttribute('aria-hidden', 'false');
            },
        });

        timeline
            .set(menu, { display: 'block', visibility: 'visible' })
            .to(menu, { duration: 0.8, height: '100dvh' }, 0)
            .to(middleLine, { duration: 0.3, opacity: 0, scaleX: 0 }, 0)
            .to(topLine, { duration: 0.3, opacity: 0, x: -20 }, 0)
            .to(bottomLine, { duration: 0.3, opacity: 0, x: 20 }, 0)
            .set(topLine, { rotate: -135, scaleX: 0.9, y: -20 })
            .set(bottomLine, { rotate: 135, scaleX: 0.9, y: -24 })
            .to(topLine, { duration: 0.3, opacity: 1, x: 0, y: 8 })
            .to(bottomLine, { duration: 0.3, opacity: 1, x: 0, y: -4 }, '<+=0.1')
            .from(
                menuLabels,
                {
                    duration: 0.8,
                    scrambleText: {
                        chars: 'uppercase',
                        delimiter: '',
                        speed: 1,
                        text: '{original}',
                    },
                    stagger: 0.1,
                },
                0.22,
            )
            .fromTo(
                menuButtons,
                { autoAlpha: 0, y: 100 },
                {
                    autoAlpha: 1,
                    duration: 0.6,
                    stagger: 0.1,
                    y: 0,
                },
                0.32,
            );
    };

    const close = () => {
        if (!isOpen || isAnimating) return;
        isAnimating = true;

        gsap.timeline({
            defaults: { duration: 0.5, ease: 'main' },
            onComplete: () => {
                isOpen = false;
                isAnimating = false;
                menu.style.display = 'none';
                menu.setAttribute('aria-hidden', 'true');
                lenis?.start();
            },
        })
            .to(lines, {
                opacity: 1,
                overwrite: 'auto',
                rotate: 0,
                scaleX: 1,
                x: 0,
                y: 0,
            })
            .to(menu, { height: '0dvh' }, '<');
    };

    button.addEventListener('click', () => {
        if (isOpen) close();
        else open();
    });

    menu.querySelectorAll<HTMLAnchorElement>('a').forEach((link) => {
        link.addEventListener('click', () => {
            if (isOpen) close();
        });
    });

    const languagePanel = document.querySelector<HTMLElement>('#language-mobile');
    const languageOpen = document.querySelector<HTMLElement>('[data-locale-open]');
    const languageClose = document.querySelector<HTMLElement>('[data-locale-close]');

    if (languagePanel) {
        gsap.set(languagePanel, { display: 'none', y: '100%' });
        languageOpen?.addEventListener('click', () => {
            gsap.to(languagePanel, {
                display: 'flex',
                duration: 0.5,
                ease: 'power3.out',
                opacity: 1,
                y: '0%',
            });
        });
        languageClose?.addEventListener('click', () => {
            gsap.to(languagePanel, {
                duration: 0.5,
                ease: 'power3.in',
                opacity: 0,
                y: '100%',
                onComplete: () => {
                    languagePanel.style.display = 'none';
                },
            });
        });
    }
}

export function destroySmoothScroll() {
    lenis?.destroy();
    lenis = null;
}
