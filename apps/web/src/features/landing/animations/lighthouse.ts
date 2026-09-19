import { gsap, ScrollTrigger, SYMBOLS } from './runtime';

export function setupLighthouseStory() {
    const section = document.querySelector<HTMLElement>('.section.is--lighthouse');
    if (!section) return;

    const wrapper = section.querySelector<HTMLElement>('.lh-top__wrap');
    const phoneWrapper = section.querySelector<HTMLElement>('.lh-phone__wrap');
    const phone = section.querySelector<HTMLElement>('.lh-phone');
    const introVideo = section.querySelector<HTMLElement>('.lh-intro__vid');
    const gridCells = section.querySelectorAll<HTMLElement>('.grid-child');
    const lines = section.querySelectorAll<HTMLElement>('.lh-top__inner .line');
    const accents = section.querySelectorAll<HTMLElement>('[data-lh-anim]');

    const video = introVideo?.querySelector<HTMLVideoElement>('video');
    if (video) {
        video.muted = true;
        video.loop = true;
        void video.play().catch(() => undefined);
    }

    if (!wrapper || !phoneWrapper || !phone) return;

    const shortLandscape = window.innerWidth < 768 && window.innerHeight < 500;
    gsap.set(phoneWrapper, { y: shortLandscape ? '140vh' : '90vh' });

    const targetScale = Math.ceil((window.innerWidth / Math.max(phone.offsetWidth, 1)) * 11) / 10;

    gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
            end: 'bottom bottom',
            scrub: true,
            start: 'top 40%',
            trigger: wrapper,
        },
    })
        .to(phoneWrapper, { duration: 0.4, y: '0vh' })
        .to(introVideo, { duration: 0.05, opacity: 0 }, 0)
        .to(
            gridCells,
            {
                duration: 0.01,
                opacity: 1,
                stagger: { amount: 0.6, from: 'random' },
            },
            0.2,
        )
        .to(
            phone,
            {
                duration: 0.6,
                ease: 'expoScale(1, 5)',
                rotate: 0.001,
                scale: targetScale,
            },
            0.35,
        )
        .from(
            lines,
            {
                autoAlpha: 0,
                duration: 0.2,
                stagger: { amount: 0.4 },
                yPercent: 50,
            },
            0.6,
        )
        .from(accents, { autoAlpha: 0, duration: 0.2 }, 0.8);

    const processSection = document.querySelector<HTMLElement>('.process-section');
    const processWrapper = processSection?.querySelector<HTMLElement>('.process-w');
    const firstProcessText = processSection?.querySelector<HTMLElement>('.process-text');

    if (processSection && processWrapper && firstProcessText) {
        const firstLines = firstProcessText.querySelectorAll<HTMLElement>('.line');
        const firstAccent =
            firstProcessText.querySelector<HTMLElement>('.line .is--alt') ??
            firstProcessText.querySelector<HTMLElement>('.is--alt');
        const processIntro = gsap
            .timeline({ defaults: { ease: 'none' } })
            .from(processWrapper, { duration: 1, opacity: 0 })
            .from(
                firstLines,
                {
                    autoAlpha: 0,
                    clearProps: 'all',
                    duration: 0.5,
                    stagger: 0.03,
                    y: '1em',
                },
                0.6,
            );

        if (firstAccent) {
            processIntro.from(
                firstAccent,
                {
                    duration: 0.5,
                    scrambleText: {
                        chars: SYMBOLS,
                        revealDelay: 0.5,
                        speed: 1,
                        text: '{original}',
                        tweenLength: false,
                    },
                },
                0.6,
            );
        }

        gsap.set(processSection, { autoAlpha: 0 });
        ScrollTrigger.create({
            animation: processIntro,
            end: 'bottom top',
            endTrigger: section,
            onEnter: () => gsap.set(processSection, { autoAlpha: 1 }),
            onLeaveBack: () => gsap.set(processSection, { autoAlpha: 0 }),
            scrub: true,
            start: 'top top',
            trigger: processSection,
        });
    }

    const outro = document.querySelector<HTMLElement>('.lh-bottom');
    const outroImage = outro?.querySelector<HTMLElement>('.lh-bottom__img');
    if (outro && outroImage) {
        gsap.fromTo(
            outroImage,
            {
                rotate: 0.001,
                xPercent: -5,
                yPercent: 10,
                z: -100,
            },
            {
                rotate: -6,
                scrollTrigger: {
                    end: 'bottom top',
                    scrub: true,
                    start: 'top bottom',
                    trigger: outro,
                },
                xPercent: 5,
                yPercent: -5,
                z: 0,
            },
        );
    }
}
