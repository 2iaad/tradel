import { BACK_NOTE, FRONT_NOTE, Note } from './home.data';
import { MaskedHeading } from './masked-heading';
import { NoteCard } from './note-card';

const h2Cls =
    'm-0 text-[clamp(36px,4vw,60px)] leading-[1.08] font-semibold tracking-[-0.025em] text-[#eef4f1]';

const FEATURES = [
    'ENTRY · EXIT · SIZE · R — STRUCTURED AUTOMATICALLY',
    'TAGS FOR SETUPS AND MISTAKES',
    'NOTES THAT RESURFACE AT REVIEW TIME',
];

// The three mono feature lines under the journal copy.
function FeatureLines() {
    return (
        <div className="mt-1.5 flex flex-col gap-3">
            {FEATURES.map((f, i) => (
                <div
                    key={f}
                    data-reveal="left"
                    data-reveal-delay={String(560 + i * 120)}
                    className="flex items-center gap-3 font-mono text-[11.5px] font-medium tracking-[0.12em] text-[#7e8d89]"
                >
                    <span className="h-px w-[18px] bg-[#2fd57f]" />
                    {f}
                </div>
            ))}
        </div>
    );
}

// Kicker, masked headline, sub copy and the feature lines.
function JournalCopy() {
    return (
        <div className="flex flex-col gap-[22px]">
            <MaskedHeading
                className={h2Cls}
                delays={[120, 260]}
                lines={['Log the why,', 'not just the fill.']}
            />
            <p
                className="m-0 max-w-[440px] text-base leading-[1.65] text-[#8a9995]"
                data-reveal="blur"
                data-reveal-delay="420"
            >
                Fills tell you what happened. Your reasoning tells you why it keeps happening.
                Capture it while it&rsquo;s still fresh &mdash; ten seconds, one honest note.
            </p>
            <FeatureLines />
        </div>
    );
}

// Two overlapping notes on a parallax wrapper; the front card drops in last.
function NoteStack({ backNote, frontNote }: { backNote: Note; frontNote: Note }) {
    return (
        <div data-parallax="0.07" className="relative will-change-transform">
            <div
                data-reveal="up"
                data-reveal-delay="150"
                className="absolute top-[26px] -right-[22px] -bottom-[26px] left-[22px]"
            >
                <div className="h-full rotate-[2.4deg]">
                    <NoteCard note={backNote} back />
                </div>
            </div>
            <div data-reveal="drop" data-reveal-delay="850" className="relative">
                <NoteCard note={frontNote} />
            </div>
        </div>
    );
}

// 02 · Journal — copy beside the parallax note-card stack.
export function JournalSection() {
    return (
        <section className="relative z-[2] flex min-h-screen items-center overflow-hidden rounded-t-[32px] bg-[#0b0e10] shadow-[0_-30px_80px_rgba(0,0,0,0.65)]">
            <div className="mx-auto grid w-full max-w-[1180px] grid-cols-1 items-center gap-[clamp(40px,6vw,96px)] px-9 py-[110px] lg:grid-cols-[1.05fr_1fr]">
                <JournalCopy />
                <NoteStack backNote={BACK_NOTE} frontNote={FRONT_NOTE} />
            </div>
        </section>
    );
}
