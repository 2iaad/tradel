import { Marquee } from '@/components/shadcn-space/animations/marquee';
import { Card, CardContent } from '@/components/ui/card';

const reviews = [
    {
        name: 'Ken Masters',
        body: '“Our productivity has nearly doubled since onboarding. Automation features removed repetitive tasks, allowing our team to focus on building instead of managing operations.”',
    },
    {
        name: 'Kira Athrun',
        body: '“What surprised us most was how quickly our team adapted. Minimal learning curve, excellent documentation, and powerful features make it a must-have for modern SaaS companies.”',
    },
    {
        name: 'Lirael Nassun',
        body: '“This is easily one of the most reliable SaaS tools we’ve adopted. The UI is intuitive, integrations are seamless, and it saves us countless hours every week.”',
    },
    {
        name: 'Jessica',
        body: 'Switching to this platform streamlined our entire workflow. Setup was effortless, performance improved instantly, and our team now ships features faster without worrying about infrastructure.',
    },
    {
        name: 'Jenny',
        body: '“We evaluated multiple solutions, but this stood out immediately. It’s fast, scalable, and thoughtfully designed for growing teams that need stability without added complexity.”',
    },
    {
        name: 'Kira Athrun',
        body: '“What surprised us most was how quickly our team adapted. Minimal learning curve, excellent documentation, and powerful features make it a must-have for modern SaaS companies.”',
    },
    {
        name: 'Ken Masters',
        body: '“Our productivity has nearly doubled since onboarding. Automation features removed repetitive tasks, allowing our team to focus on building instead of managing operations.”',
    },
];

const firstRow = reviews.slice(0, reviews.length / 2);
const secondRow = reviews.slice(reviews.length / 2);

function ReviewCard({
    name,
    body,
}: {
    name: string;
    body: string;
}) {
    return (
        <Card className="h-38 w-72 rounded-xl border border-border/30 bg-card/50 p-6 shadow-none">
            <CardContent className="flex h-full flex-col p-0">
                <p className="text-lg tracking-wide text-primary">★★★★★</p>
                <p className="mt-3 line-clamp-2 text-sm leading-5 text-foreground">{body}</p>
                <p className="mt-2 text-xs text-muted-foreground">— {name}</p>
            </CardContent>
        </Card>
    );
}

export default function TestimonialMarqueeDemo() {
    return (
        <div className="relative mx-auto flex w-9/10 flex-col items-center justify-center overflow-hidden">
            <Marquee pauseOnHover className="[--duration:20s]">
                {firstRow.map((review) => (
                    <ReviewCard key={review.name} {...review} />
                ))}
            </Marquee>
            <Marquee reverse pauseOnHover className="[--duration:20s]">
                {secondRow.map((review) => (
                    <ReviewCard key={review.name} {...review} />
                ))}
            </Marquee>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-background" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-background" />
        </div>
    );
}
