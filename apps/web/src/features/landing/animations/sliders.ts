import Swiper from 'swiper';
import { EffectCoverflow, Mousewheel, Navigation } from 'swiper/modules';
import { ScrollTrigger } from './runtime';

function revealSwiper(container: HTMLElement) {
    container.style.opacity = '0';
    requestAnimationFrame(() => {
        container.style.transition = 'opacity 250ms ease';
        container.style.opacity = '1';
    });
}

export function setupSwipers() {
    const coverflow = document.querySelector<HTMLElement>('.swiper.coverflow');
    if (coverflow) {
        const instance = new Swiper(coverflow, {
            breakpoints: {
                480: { spaceBetween: 50 },
            },
            centeredSlides: true,
            coverflowEffect: {
                depth: 100,
                modifier: 1,
                rotate: 35,
                slideShadows: false,
                stretch: 0,
            },
            effect: 'coverflow',
            grabCursor: true,
            initialSlide: 1,
            modules: [EffectCoverflow, Navigation],
            navigation: {
                nextEl: document.querySelector<HTMLElement>('[data-coverflow-next]'),
                prevEl: document.querySelector<HTMLElement>('[data-coverflow-prev]'),
            },
            slideToClickedSlide: true,
            slidesPerView: 'auto',
            spaceBetween: 16,
            speed: 600,
        });
        revealSwiper(coverflow);
        void instance;
    }

    const press = document.querySelector<HTMLElement>('.swiper.press');
    if (press) {
        const instance = new Swiper(press, {
            breakpoints: {
                480: { spaceBetween: 64 },
            },
            centeredSlides: true,
            grabCursor: true,
            modules: [Navigation],
            navigation: {
                nextEl: document.querySelector<HTMLElement>('[data-press-next]'),
                prevEl: document.querySelector<HTMLElement>('[data-press-prev]'),
            },
            slidesPerView: 'auto',
            spaceBetween: 16,
            speed: 800,
        });
        revealSwiper(press);
        ScrollTrigger.create({
            once: true,
            onEnter: () => instance.slideTo(1, 800, true),
            start: 'center 75%',
            trigger: press,
        });
    }

    const reviews = document.querySelector<HTMLElement>('.swiper.reviews');
    if (reviews) {
        const instance = new Swiper(reviews, {
            breakpoints: {
                480: { slidesPerView: 2.5, spaceBetween: 24 },
                767: { slidesPerView: 'auto', spaceBetween: 48 },
            },
            centeredSlides: true,
            grabCursor: true,
            modules: [Mousewheel],
            mousewheel: {
                enabled: true,
                forceToAxis: true,
            },
            slideToClickedSlide: true,
            slidesPerView: 1.2,
            spaceBetween: 16,
            speed: 800,
        });
        revealSwiper(reviews);
        ScrollTrigger.create({
            once: true,
            onEnter: () => instance.slideTo(2, 800, true),
            start: 'center 75%',
            trigger: reviews,
        });
    }
}
