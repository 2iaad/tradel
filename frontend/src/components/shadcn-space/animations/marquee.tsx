import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface MarqueeProps extends ComponentPropsWithoutRef<'div'> {
    className?: string;
    /** Whether to reverse the animation direction. */
    reverse?: boolean;
    /** Whether to pause the animation on hover. */
    pauseOnHover?: boolean;
    /** Content to be displayed in the marquee. */
    children: ReactNode;
    /** Whether to animate vertically instead of horizontally. */
    vertical?: boolean;
    /** Number of times to repeat the content. */
    repeat?: number;
}

export function Marquee({
    className,
    reverse = false,
    pauseOnHover = false,
    children,
    vertical = false,
    repeat = 4,
    ...props
}: MarqueeProps) {
    return (
        <>
            <style>
                {`
                    @keyframes shadcn-space-marquee {
                        from { transform: translateX(0); }
                        to { transform: translateX(calc(-100% - var(--gap))); }
                    }

                    @keyframes shadcn-space-marquee-vertical {
                        from { transform: translateY(0); }
                        to { transform: translateY(calc(-100% - var(--gap))); }
                    }

                    .animate-shadcn-space-marquee {
                        animation: shadcn-space-marquee var(--duration) linear infinite;
                    }

                    .animate-shadcn-space-marquee-vertical {
                        animation: shadcn-space-marquee-vertical var(--duration) linear infinite;
                    }

                    .animate-shadcn-space-reverse {
                        animation-direction: reverse !important;
                    }

                    .pause-shadcn-space-marquee:hover .animate-shadcn-space-marquee,
                    .pause-shadcn-space-marquee:hover .animate-shadcn-space-marquee-vertical {
                        animation-play-state: paused !important;
                    }
                `}
            </style>
            <div
                {...props}
                className={cn(
                    'group flex gap-(--gap) overflow-hidden p-2 [--duration:40s] [--gap:1rem]',
                    {
                        'flex-row': !vertical,
                        'flex-col': vertical,
                        'pause-shadcn-space-marquee': pauseOnHover,
                    },
                    className,
                )}
            >
                {Array.from({ length: repeat }, (_, index) => (
                    <div
                        key={index}
                        className={cn('flex shrink-0 justify-around gap-(--gap)', {
                            'animate-shadcn-space-marquee flex-row': !vertical,
                            'animate-shadcn-space-marquee-vertical flex-col': vertical,
                            'animate-shadcn-space-reverse': reverse,
                        })}
                    >
                        {children}
                    </div>
                ))}
            </div>
        </>
    );
}

export type { MarqueeProps };
