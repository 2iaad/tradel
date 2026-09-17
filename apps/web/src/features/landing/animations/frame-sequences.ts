import { gsap, ScrollTrigger, SYMBOLS } from './runtime';

type FrameSequence = {
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    embed: HTMLElement;
    images: HTMLImageElement[];
    frameCount: number;
    resize: () => void;
    draw: (frame: number) => void;
};

function drawCover(context: CanvasRenderingContext2D, image: HTMLImageElement) {
    const canvas = context.canvas;
    const imageWidth = image.naturalWidth || image.width;
    const imageHeight = image.naturalHeight || image.height;
    if (!imageWidth || !imageHeight || !canvas.width || !canvas.height) return;

    const scale = Math.max(canvas.width / imageWidth, canvas.height / imageHeight);
    const width = imageWidth * scale;
    const height = imageHeight * scale;
    const x = (canvas.width - width) * 0.5;
    const y = (canvas.height - height) * 0.5;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, x, y, width, height);
}

function createFrameSequence(container: HTMLElement): FrameSequence | null {
    const canvas = container.querySelector<HTMLCanvasElement>('canvas');
    const embed = container.querySelector<HTMLElement>('.embed');
    const context = canvas?.getContext('2d');
    if (!canvas || !embed || !context) return null;

    const frameCount = Number.parseInt(container.getAttribute('total-frames') ?? '0', 10);
    const zeros = Number.parseInt(container.getAttribute('floating-zeros') ?? '0', 10);
    const urlStart = container.getAttribute('url-start') ?? '';
    const urlEnd = container.getAttribute('url-end') ?? '';

    const images = Array.from({ length: frameCount }, (_, index) => {
        const image = new Image();
        image.decoding = 'async';
        image.src = `${urlStart}${String(index + 1).padStart(zeros, '0')}${urlEnd}`;
        return image;
    });

    const resize = () => {
        canvas.width = Math.max(1, Math.round(embed.offsetWidth));
        canvas.height = Math.max(1, Math.round(embed.offsetHeight));
    };

    const draw = (frame: number) => {
        const boundedFrame = Math.max(0, Math.min(frameCount - 1, frame));
        const image = images[boundedFrame];
        if (image?.complete && image.naturalWidth) {
            drawCover(context, image);
        }
    };

    resize();
    images[0]?.addEventListener('load', () => draw(0), { once: true });

    const onResize = gsap.utils.pipe(() => {
        resize();
        draw(0);
    });
    let resizeTimer = 0;
    window.addEventListener('resize', () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(onResize, 100);
    });

    return { canvas, context, embed, frameCount, images, resize, draw };
}

export function setupProcessSequence() {
    const container = document.querySelector<HTMLElement>('[data-scrub-section]');
    if (!container) return;

    const sequence = createFrameSequence(container);
    if (!sequence) return;

    const state = { frame: 0 };
    const progressBars = Array.from(container.querySelectorAll<HTMLElement>('.progress-bar'));

    gsap.to(state, {
        ease: 'none',
        frame: sequence.frameCount - 1,
        onUpdate: () => sequence.draw(Math.round(state.frame)),
        scrollTrigger: {
            end: container.getAttribute('scroll-end') ?? 'bottom bottom',
            onUpdate: (trigger) => {
                const current = Math.min(
                    progressBars.length - 1,
                    Math.floor(trigger.progress * progressBars.length),
                );

                progressBars.forEach((bar, index) => {
                    bar.classList.toggle('is--full', index < current);
                    bar.classList.toggle('is--tall', index === current);
                });

                if (trigger.progress >= 1) {
                    progressBars.at(-1)?.classList.add('is--full');
                    progressBars.at(-1)?.classList.remove('is--tall');
                }
            },
            scrub: true,
            start: container.getAttribute('scroll-start') ?? 'top top',
            trigger: container,
        },
        snap: 'frame',
    });

    setupProcessText(container);
}

function setupProcessText(container: HTMLElement) {
    const texts = Array.from(container.querySelectorAll<HTMLElement>('.process-text'));
    const triggers = Array.from(container.querySelectorAll<HTMLElement>('.process-trigger'));
    const counter = container.querySelector<HTMLElement>('[data-progress-nr]');
    if (!texts.length) return;

    texts.forEach((text, index) => {
        gsap.set(text, { opacity: index === 0 ? 1 : 0 });
    });

    triggers.forEach((trigger, index) => {
        const current = texts[index];
        const next = texts[index + 1];
        if (!current || !next) return;

        const currentLines = current.querySelectorAll<HTMLElement>('.line');
        const nextLines = next.querySelectorAll<HTMLElement>('.line');
        const currentAccent =
            current.querySelector<HTMLElement>('.line .is--alt') ??
            current.querySelector<HTMLElement>('.is--alt');
        const nextAccent =
            next.querySelector<HTMLElement>('.line .is--alt') ??
            next.querySelector<HTMLElement>('.is--alt');

        gsap.timeline({
            scrollTrigger: {
                end: 'top 40%',
                onEnter: () => {
                    if (counter) counter.textContent = `0${index + 2}`;
                },
                onLeaveBack: () => {
                    if (counter) counter.textContent = `0${index + 1}`;
                },
                scrub: true,
                start: 'top 80%',
                trigger,
            },
        })
            .set(next, { opacity: 1 }, 0)
            .to(
                currentLines,
                {
                    autoAlpha: 0,
                    duration: 0.5,
                    stagger: 0.03,
                    y: '-1em',
                },
                0,
            )
            .to(
                currentAccent,
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
                0,
            )
            .set(current, { opacity: 0 }, 0.5)
            .from(
                nextLines,
                {
                    autoAlpha: 0,
                    duration: 0.5,
                    immediateRender: true,
                    stagger: 0.03,
                    y: '1em',
                },
                0.5,
            )
            .from(
                nextAccent,
                {
                    duration: 0.5,
                    immediateRender: true,
                    scrambleText: {
                        chars: SYMBOLS,
                        revealDelay: 0.5,
                        speed: 1,
                        text: '{original}',
                        tweenLength: false,
                    },
                },
                0.5,
            );
    });
}

export function setupSupportSequence() {
    const container = document.querySelector<HTMLElement>('[data-autoplay-section]');
    if (!container) return;

    const sequence = createFrameSequence(container);
    if (!sequence) return;

    let frame = 0;
    let interval: number | null = null;
    const fps = Number.parseInt(container.getAttribute('fps') ?? '30', 10);

    const start = () => {
        if (interval !== null) return;
        interval = window.setInterval(() => {
            frame = (frame + 1) % sequence.frameCount;
            sequence.draw(frame);
        }, 1000 / fps);
    };

    const stop = () => {
        if (interval === null) return;
        window.clearInterval(interval);
        interval = null;
    };

    ScrollTrigger.create({
        end: 'bottom top',
        onEnter: start,
        onEnterBack: start,
        onLeave: stop,
        onLeaveBack: stop,
        start: 'top bottom',
        trigger: container,
    });
}
