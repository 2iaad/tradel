import { gsap, ScrollTrigger } from './runtime';

export function setupEducationToggle() {
    const toggles = Array.from(document.querySelectorAll<HTMLElement>('.blog-toggle__link'));
    if (!toggles.length) return;

    const newsCards = document.querySelectorAll<HTMLElement>('[data-blog-card="news"]');
    const academyCards = document.querySelectorAll<HTMLElement>('[data-blog-card="academy"]');
    const content = document.querySelector<HTMLElement>('.toggle-content');
    const newsWrapper = document.querySelector<HTMLElement>('.toggle-news__wrap');
    const academyWrapper = document.querySelector<HTMLElement>('.toggle-academy__wrap');
    let showAcademy = true;

    const maxHeight = (elements: NodeListOf<HTMLElement>) =>
        Math.max(...Array.from(elements, (element) => element.offsetHeight), 0);

    const switchCards = (academy: boolean) => {
        if (academy) {
            if (academyWrapper) academyWrapper.style.display = 'block';
            if (content) {
                content.style.height = `${maxHeight(
                    document.querySelectorAll<HTMLElement>('.toggle-academy__wrap'),
                )}px`;
            }
            gsap.to(newsCards, {
                autoAlpha: 0,
                ease: 'main',
                stagger: 0.05,
                xPercent: -50,
            });
            gsap.to(academyCards, {
                autoAlpha: 1,
                delay: 0.1,
                ease: 'main',
                onComplete: () => {
                    if (newsWrapper) newsWrapper.style.display = 'none';
                },
                stagger: 0.05,
                xPercent: -50,
            });
        } else {
            if (newsWrapper) newsWrapper.style.display = 'block';
            if (content) {
                content.style.height = `${maxHeight(
                    document.querySelectorAll<HTMLElement>('.toggle-news__wrap'),
                )}px`;
            }
            gsap.to(newsCards, {
                autoAlpha: 1,
                delay: 0.1,
                ease: 'main',
                stagger: { each: 0.05, from: 'start' },
                xPercent: 0,
            });
            gsap.to(academyCards, {
                autoAlpha: 0,
                ease: 'main',
                onComplete: () => {
                    if (academyWrapper) academyWrapper.style.display = 'none';
                },
                stagger: { each: 0.05, from: 'start' },
                xPercent: 50,
            });
        }
    };

    toggles.forEach((toggle) => {
        toggle.addEventListener('click', (event) => {
            event.preventDefault();
            toggles.forEach((candidate) => candidate.classList.toggle('active'));
            switchCards(showAcademy);
            showAcademy = !showAcademy;
            ScrollTrigger.refresh();
        });
    });
}

export function setupMarquees() {
    document.querySelectorAll<HTMLElement>('[data-css-marquee]').forEach((marquee) => {
        const originals = Array.from(
            marquee.querySelectorAll<HTMLElement>('[data-css-marquee-list]'),
        );
        if (originals.length === 1) {
            marquee.append(originals[0].cloneNode(true));
        }

        const lists = marquee.querySelectorAll<HTMLElement>('[data-css-marquee-list]');
        lists.forEach((list) => {
            list.style.animationDuration = `${list.offsetWidth / 75}s`;
            list.style.animationPlayState = 'paused';
        });

        const observer = new IntersectionObserver(([entry]) => {
            lists.forEach((list) => {
                list.style.animationPlayState = entry?.isIntersecting ? 'running' : 'paused';
            });
        });
        observer.observe(marquee);
    });
}

export function setupVisibilityObservers() {
    document.querySelectorAll<HTMLElement>('[data-visible]').forEach((element) => {
        ScrollTrigger.create({
            end: 'bottom top',
            onEnter: () => element.setAttribute('data-visible', 'true'),
            onEnterBack: () => element.setAttribute('data-visible', 'true'),
            onLeave: () => element.setAttribute('data-visible', 'false'),
            onLeaveBack: () => element.setAttribute('data-visible', 'false'),
            start: 'top bottom',
            trigger: element,
        });
    });
}

export function setupScrambleLinks() {
    document.querySelectorAll<HTMLElement>('[scramble-link]').forEach((link) => {
        const label = link.querySelector<HTMLElement>('[scramble-text]') ?? link;
        const timeline = gsap.timeline({ paused: true });
        timeline.to(label, {
            duration: 0.8,
            ease: 'main',
            scrambleText: {
                chars: 'uppercase',
                delimiter: '',
                speed: 1,
                text: '{original}',
            },
        });

        link.addEventListener('mouseenter', () => {
            timeline.timeScale(1).play();
        });
        link.addEventListener('mouseleave', () => {
            timeline.timeScale(100).reverse();
        });
    });
}

export function setupSeoShowMore() {
    document.querySelectorAll<HTMLElement>('.seo-show-button').forEach((button) => {
        const section =
            button.closest<HTMLElement>('.jhjhjh') ?? button.parentElement?.parentElement;
        const wrapper = section?.querySelector<HTMLElement>('.seo-wrapper');
        const fade = section?.querySelector<HTMLElement>('.div-block-10');
        const more = button.querySelector<HTMLElement>('.seo-more');
        const less = button.querySelector<HTMLElement>('.seo-less');
        const icon = button.querySelector<HTMLElement>('[seo-show-icon]');
        const collapsedHeight = 140;
        let expanded = false;
        let animating = false;

        if (wrapper) gsap.set(wrapper, { height: collapsedHeight });
        if (icon) gsap.set(icon, { rotation: 180 });

        button.addEventListener('click', (event) => {
            event.preventDefault();
            if (animating) return;
            animating = true;
            expanded = !expanded;

            if (expanded) {
                if (wrapper) {
                    gsap.set(wrapper, { height: 'auto' });
                    const height = wrapper.scrollHeight;
                    gsap.set(wrapper, { height: collapsedHeight });
                    gsap.to(wrapper, {
                        duration: 0.5,
                        ease: 'power2.inOut',
                        height,
                        onComplete: () => {
                            gsap.set(wrapper, { height: 'auto' });
                            animating = false;
                            ScrollTrigger.refresh();
                        },
                    });
                } else {
                    animating = false;
                }
                if (fade) gsap.to(fade, { duration: 0.4, opacity: 0 });
                if (more) {
                    gsap.to(more, {
                        duration: 0.2,
                        opacity: 0,
                        onComplete: () => {
                            more.style.display = 'none';
                        },
                    });
                }
                if (less) {
                    less.style.display = 'flex';
                    gsap.fromTo(less, { opacity: 0 }, { delay: 0.15, duration: 0.2, opacity: 1 });
                }
                if (icon) {
                    gsap.to(icon, {
                        duration: 0.4,
                        ease: 'power2.inOut',
                        rotation: 0,
                    });
                }
            } else {
                if (wrapper) {
                    gsap.to(wrapper, {
                        duration: 0.5,
                        ease: 'power2.inOut',
                        height: collapsedHeight,
                        onComplete: () => {
                            animating = false;
                            ScrollTrigger.refresh();
                        },
                    });
                } else {
                    animating = false;
                }
                if (fade) gsap.to(fade, { duration: 0.4, opacity: 1 });
                if (less) {
                    gsap.to(less, {
                        duration: 0.2,
                        opacity: 0,
                        onComplete: () => {
                            less.style.display = '';
                        },
                    });
                }
                if (more) {
                    more.style.display = '';
                    gsap.fromTo(more, { opacity: 0 }, { delay: 0.15, duration: 0.2, opacity: 1 });
                }
                if (icon) {
                    gsap.to(icon, {
                        duration: 0.4,
                        ease: 'power2.inOut',
                        rotation: 180,
                    });
                }
            }
        });
    });
}

export function setupResponsiveState() {
    const setAppHeight = () => {
        document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
    };
    setAppHeight();

    let resizeTimer = 0;
    window.addEventListener('resize', () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(() => {
            setAppHeight();
            ScrollTrigger.refresh();
        }, 150);
    });
}
