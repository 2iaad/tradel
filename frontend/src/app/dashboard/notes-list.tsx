import { cardCls, ghostBtnCls, h2Cls } from '@/lib/ui';
import { NOTES, Note } from './dashboard.data';

// One journal note with date + tag pills.
function NoteCard({ n }: { n: Note }) {
    return (
        <div className="border border-[#1b2226] rounded-lg px-[15px] py-3.5 flex flex-col gap-2 transition-colors cursor-pointer hover:border-[#2fd57f44]">
            <span className="text-sm font-medium text-[#e9eef0]">{n.title}</span>
            <span className="text-[12.5px] leading-normal text-[#7e8d89]">{n.body}</span>
            <span className="flex items-center gap-1.5 flex-wrap">
                <span className="font-mono text-[10px] font-medium text-[#5f6b70] mr-1">
                    {n.date}
                </span>
                {n.tags.map((tag) => (
                    <span
                        key={tag}
                        className="inline-flex px-2 py-0.5 rounded font-mono text-[9.5px] font-medium tracking-[0.06em] text-[#78878a] border border-[#222a2f]"
                    >
                        {tag}
                    </span>
                ))}
            </span>
        </div>
    );
}

// Journal-notes card for the signed-in dashboard.
export function NotesList() {
    return (
        <div className={`${cardCls} px-[22px] py-5 flex flex-col gap-3`}>
            <div className="flex items-center justify-between">
                <h2 className={h2Cls}>Journal notes</h2>
                <button type="button" className={ghostBtnCls}>
                    + NEW
                </button>
            </div>
            {NOTES.map((n) => (
                <NoteCard key={n.title} n={n} />
            ))}
        </div>
    );
}
