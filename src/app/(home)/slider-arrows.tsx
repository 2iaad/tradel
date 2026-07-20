// Pixel-art prev/next buttons shared by the press and community swipers.
const ARROW_PATH =
    'M0.216797 5.9126L0.216797 11.0874L1.71423 11.0874L1.71423 12.5731L3.21167 12.5731L3.21167 14.0488L4.71936 14.0488L4.71936 15.5244L6.2168 15.5244L6.2168 17L9.22192 17L9.22192 15.5244L7.71423 15.5244L7.71423 14.0488L6.2168 14.0488L6.2168 12.5731L4.71936 12.5731L4.71936 11.0874L3.21167 11.0874L3.21167 9.61177L18.2168 9.61177L18.2168 7.39834L3.21167 7.39833L3.21167 5.9126L4.71936 5.9126L4.71936 4.43698L6.2168 4.43698L6.2168 2.96136L7.71423 2.96136L7.71423 1.47562L9.22193 1.47562L9.22193 -3.93178e-07L6.2168 -5.24537e-07L6.2168 1.47562L4.71936 1.47562L4.71936 2.96136L3.21167 2.96136L3.21167 4.43698L1.71423 4.43698L1.71423 5.9126L0.216797 5.9126Z';

type Control = 'press' | 'coverflow';

function SliderArrow({ control, direction }: { control: Control; direction: 'prev' | 'next' }) {
    return (
        <span
            aria-label={direction === 'prev' ? 'Previous slide' : 'Next slide'}
            className={`slider-button ${direction} w-inline-block`}
            {...{ [`data-${control}-${direction}`]: '' }}
        >
            {' '}
            <div className="cta-circle__bg is--black" />
            <svg fill="none" viewBox="0 0 19 17" width="100%" xmlns="http://www.w3.org/2000/svg">
                {' '}
                <path d={ARROW_PATH} fill="currentColor" />{' '}
            </svg>{' '}
        </span>
    );
}

export function SliderArrows({ control }: { control: Control }) {
    return (
        <div className="flex-h a--center gap--med">
            {' '}
            <SliderArrow control={control} direction="prev" />{' '}
            <SliderArrow control={control} direction="next" />{' '}
        </div>
    );
}
