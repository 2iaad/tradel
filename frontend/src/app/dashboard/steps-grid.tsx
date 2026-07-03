import { STEPS } from './dashboard.data';

type Step = (typeof STEPS)[number];

const accent = (a: boolean) => (a ? 'text-[#2fd57f]' : 'text-[#5f6b70]');

// Step number + START/LOCKED tag row.
function StepTop({ num, active }: { num: string; active: boolean }) {
    return (
        <span className="flex items-center justify-between">
            <span
                className={`font-mono text-[11px] font-semibold tracking-[0.14em] ${accent(active)}`}
            >
                {num}
            </span>
            <span
                className={`font-mono text-[9.5px] font-semibold tracking-[0.1em] ${accent(active)}`}
            >
                {active ? 'START →' : 'LOCKED'}
            </span>
        </span>
    );
}

const stepCls = (active: boolean) =>
    `text-left bg-[#0e1214] border rounded-[10px] px-5 py-[18px] flex flex-col gap-2 transition-[border-color,transform] duration-200 hover:-translate-y-0.5 ${
        active ? 'border-[#2fd57f] cursor-pointer' : 'border-[#1b2226] opacity-55 cursor-default'
    }`;

// One onboarding step; only the active one is clickable.
function StepCard({ s, active, onStart }: { s: Step; active: boolean; onStart: () => void }) {
    return (
        <button type="button" onClick={active ? onStart : undefined} className={stepCls(active)}>
            <StepTop num={s.num} active={active} />
            <span
                className={`text-base font-semibold ${active ? 'text-[#eef4f2]' : 'text-[#93a09d]'}`}
            >
                {s.title}
            </span>
            <span className="text-[12.5px] leading-normal text-[#7e8d89]">{s.desc}</span>
        </button>
    );
}

// Guest onboarding checklist — step 01 active, rest locked.
export function StepsGrid({ onStart }: { onStart: () => void }) {
    return (
        <div className="grid grid-cols-3 gap-4">
            {STEPS.map((s, i) => (
                <StepCard key={s.num} s={s} active={i === 0} onStart={onStart} />
            ))}
        </div>
    );
}
