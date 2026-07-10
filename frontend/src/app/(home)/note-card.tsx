import type { Note } from './home.data';

const chipGreen = 'border border-[rgba(47,213,127,0.25)] bg-[rgba(47,213,127,0.08)] text-[#2fd57f]';
const chipRed = 'border border-[rgba(240,85,78,0.25)] bg-[rgba(240,85,78,0.08)] text-[#f0554e]';

// Ticker + side chip + P&L header row.
function NoteHeader({ note }: { note: Note }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
                <span className="font-mono text-[15px] font-semibold text-[#e9eef0]">
                    {note.sym}
                </span>
                <span
                    className={`inline-flex rounded px-[9px] py-[3px] font-mono text-[9.5px] font-semibold tracking-[0.08em] ${note.green ? chipGreen : chipRed}`}
                >
                    {note.side}
                </span>
            </div>
            <span
                className={`font-mono text-[15px] font-semibold ${note.green ? 'text-[#2fd57f]' : 'text-[#f0554e]'}`}
            >
                {note.pnl}
            </span>
        </div>
    );
}

// IN / OUT / SIZE / R strip with the R multiple colored by outcome.
function NoteStats({ note }: { note: Note }) {
    const [inn, out, size, r] = note.stats;
    return (
        <div className="flex gap-[18px] border-b border-[#1b2226] pb-3.5 font-mono text-[11.5px] text-[#5f6b70]">
            <span>{inn}</span>
            <span>{out}</span>
            <span>{size}</span>
            <span className={note.green ? 'text-[#2fd57f]' : 'text-[#f0554e]'}>{r}</span>
        </div>
    );
}

// Tag chips + timestamp footer row.
function NoteTags({ note }: { note: Note }) {
    return (
        <div className="flex items-center gap-1.5">
            {note.tags.map((t) => (
                <span
                    key={t}
                    className="inline-flex rounded border border-[#222a2f] px-[9px] py-[3px] font-mono text-[9.5px] font-medium tracking-[0.06em] text-[#78878a]"
                >
                    {t}
                </span>
            ))}
            <span className="ml-auto font-mono text-[10px] text-[#4d5a5f]">{note.ts}</span>
        </div>
    );
}

// One journal note — `back` renders the dimmer under-card variant.
export function NoteCard({ note, back }: { note: Note; back?: boolean }) {
    return (
        <div
            className={`box-border flex h-full flex-col gap-4 overflow-hidden rounded-[14px] border px-7 py-[26px] ${back ? 'border-[#1b2226] bg-[#0e1214]' : 'border-[#222a2f] bg-[#10161a] shadow-[0_24px_70px_rgba(0,0,0,0.5)]'}`}
        >
            <NoteHeader note={note} />
            <NoteStats note={note} />
            <div className="flex flex-col gap-2">
                <span className="text-base font-semibold text-[#e9eef0]">{note.title}</span>
                <span className="text-[13.5px] leading-[1.6] text-[#8a9995]">{note.body}</span>
            </div>
            <NoteTags note={note} />
        </div>
    );
}
