import { linkCls } from '@/lib/ui';

// Footer line that switches between the auth forms ("New to Tradel? ...").
export function SwitchLine({
    text,
    label,
    onClick,
}: {
    text?: string;
    label: string;
    onClick: () => void;
}) {
    return (
        <p className="mt-1 mb-0 text-[13.5px] text-[#6b7a76] text-center">
            {text && <>{text} </>}
            <button type="button" onClick={onClick} className={`${linkCls} text-[13.5px]`}>
                {label}
            </button>
        </p>
    );
}
