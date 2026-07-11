// Segmented pill toggle; the active option fills green.
export function SegmentedTabs<T extends string>({
    options,
    active,
    onChange,
}: {
    options: readonly T[];
    active: T;
    onChange: (value: T) => void;
}) {
    return (
        <div className="flex gap-1 bg-[#0a0d0f] border border-[#1b2226] rounded-lg p-[3px]">
            {options.map((opt) => {
                const on = opt === active;
                return (
                    <button
                        key={opt}
                        type="button"
                        onClick={() => onChange(opt)}
                        className={`border-none cursor-pointer rounded-md px-[13px] py-1.5 font-mono text-[11px] font-semibold tracking-[0.08em] transition-colors ${on ? "bg-[#2fd57f] text-[#04130a]" : "bg-transparent text-[#5f6b70] hover:text-[#c8d2d0]"}`}
                    >
                        {opt}
                    </button>
                );
            })}
        </div>
    );
}
