import { inputCls, labelCls } from '@/lib/ui';

// Labeled form input styled to the Carbon Terminal theme.
export function Field({
    label,
    ...input
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <div>
            <label className={labelCls}>{label}</label>
            <input {...input} className={inputCls} />
        </div>
    );
}
