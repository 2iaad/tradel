import { cn } from '@/lib/utils';

// Layout contract for centered editorial sections on the landing page.
// Full-bleed sections such as the hero and partner marquee are intentional exceptions.
const landingSectionContainerClass =
    'mx-auto w-full max-w-[1120px] px-6 sm:px-10 lg:px-16 xl:px-20';

const landingSectionTitleClass =
    'm-0 mx-auto max-w-[560px] text-center font-heading text-[30px] font-semibold leading-[1.12] tracking-[-0.025em] text-card-foreground normal-case';

const landingSectionBodyClass =
    'font-sans text-xs leading-5 text-content-faint normal-case sm:text-ui-sm';

const landingSectionMetaClass =
    'font-mono text-ui-xs font-medium uppercase tracking-[0.18em] text-content-faint';

type LandingSectionProps = {
    children: React.ReactNode;
    className?: string;
    id?: string;
};

export function LandingSection({ children, className, id }: LandingSectionProps) {
    return (
        <section
            id={id}
            className={cn(
                'section relative z-[3] flex min-h-[100svh] scroll-mt-20 flex-col justify-center bg-background py-20 text-foreground sm:py-28 lg:py-32',
                className,
            )}
        >
            <div className={landingSectionContainerClass}>{children}</div>
        </section>
    );
}

type LandingSectionHeadingProps = {
    description?: React.ReactNode;
    eyebrow?: string;
    title: React.ReactNode;
};

export function LandingSectionHeading({
    description,
    eyebrow,
    title,
}: LandingSectionHeadingProps) {
    return (
        <header className="mx-auto flex max-w-[760px] flex-col items-center text-center">
            {eyebrow && (
                <p className={`${landingSectionMetaClass} mb-4 text-primary`}>
                    {eyebrow}
                </p>
            )}
            <h2 className={landingSectionTitleClass}>{title}</h2>
            {description && (
                <p className={`${landingSectionBodyClass} mt-5 max-w-[620px] text-center`}>
                    {description}
                </p>
            )}
        </header>
    );
}

export {
    landingSectionBodyClass,
    landingSectionContainerClass,
    landingSectionMetaClass,
    landingSectionTitleClass,
};
