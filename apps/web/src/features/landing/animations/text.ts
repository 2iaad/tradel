import { gsap, SplitText } from './runtime';

const splits: SplitText[] = [];

export function setupSplitText() {
    const processLineTargets = Array.from(
        document.querySelectorAll<HTMLElement>('.process-text [data-split-lines]'),
    );
    const responsiveLineTargets = Array.from(
        document.querySelectorAll<HTMLElement>('[data-split-lines]'),
    ).filter((target) => !target.closest('.process-text'));

    if (responsiveLineTargets.length) {
        splits.push(
            SplitText.create(responsiveLineTargets, {
                autoSplit: true,
                linesClass: 'line',
                type: 'lines',
            }),
        );
    }

    if (processLineTargets.length) {
        splits.push(
            SplitText.create(processLineTargets, {
                autoSplit: false,
                linesClass: 'line',
                type: 'lines',
            }),
        );
    }
}

export function setupPixelScanners() {
    document.querySelectorAll<HTMLElement>('.bg').forEach((background) => {
        const columns = background.querySelectorAll<HTMLElement>('.cell-col');
        columns.forEach((column, columnIndex) => {
            const cells = Array.from(column.querySelectorAll<HTMLElement>('.cell')).reverse();

            const timeline = gsap.timeline({
                delay: columnIndex * 1.25,
                scrollTrigger: {
                    end: 'bottom top-=150%',
                    start: 'top-=500 bottom',
                    toggleActions: 'play pause resume pause',
                    trigger: background.parentElement,
                },
            });

            cells.forEach((cell, cellIndex) => {
                timeline.to(
                    cell,
                    {
                        keyframes: [
                            { duration: 0, opacity: 0 },
                            { duration: 0.25, opacity: 0.1 },
                            { duration: 0.25, opacity: 0.2 },
                            { duration: 0.25, opacity: 0.5 },
                            { duration: 0.25, opacity: 1 },
                            { duration: 0.25, opacity: 0.5 },
                            { duration: 0.25, opacity: 0.2 },
                            { duration: 0.25, opacity: 0.1 },
                            { duration: 0.25, opacity: 0 },
                        ],
                        repeat: -1,
                        repeatDelay: 2,
                    },
                    cellIndex * 0.25,
                );
            });
        });
    });
}

export function setupStaggeredTitles() {
    document.querySelectorAll<HTMLElement>('[data-stagger-title]').forEach((title) => {
        const cells = title.querySelectorAll('rect');
        gsap.fromTo(
            cells,
            { opacity: 0 },
            {
                duration: 0.001,
                opacity: 1,
                scrollTrigger: {
                    end: 'top center',
                    scrub: true,
                    start: 'top bottom',
                    trigger: title,
                },
                stagger: {
                    amount: 1,
                    from: 'random',
                },
            },
        );
    });
}

export function revertSplitText() {
    splits.forEach((split) => split.revert());
    splits.length = 0;
}
