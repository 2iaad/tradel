// Headline whose lines rise out of overflow-hidden masks on reveal.
export function MaskedHeading({
    lines,
    delays,
    className,
    h1,
}: {
    lines: React.ReactNode[];
    delays: number[];
    className: string;
    h1?: boolean;
}) {
    const Tag = h1 ? 'h1' : 'h2';
    return (
        <Tag className={className}>
            {lines.map((line, i) => (
                <span key={i} className="block overflow-hidden pb-[0.06em]">
                    <span
                        data-reveal="mask"
                        data-reveal-delay={String(delays[i])}
                        className="block"
                    >
                        {line}
                    </span>
                </span>
            ))}
        </Tag>
    );
}
