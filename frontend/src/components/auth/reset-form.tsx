'use client';

import { btnCls } from '@/lib/ui';
import { Mode, formCls } from './common';
import { EmailField } from './email-field';
import { FormHeading } from './form-heading';
import { SwitchLine } from './switch-line';

// Password-recovery form.
export function ResetForm({ onSwitch }: { onSwitch: (m: Mode) => void }) {
    // ponytail: reset form only preventDefaults — no backend endpoint exists yet.
    const noSubmit = (e: React.FormEvent) => e.preventDefault();

    return (
        <form onSubmit={noSubmit} className={formCls}>
            <FormHeading kicker="/// RESET PASSWORD" title="Recover access" />
            <p className="m-0 text-sm leading-[1.55] text-[#78878a]">
                Enter the email tied to your account and we&rsquo;ll send a secure reset link.
            </p>
            <EmailField />
            <button type="submit" className={btnCls}>
                Send reset link
            </button>
            <SwitchLine label="← Back to sign in" onClick={() => onSwitch('login')} />
        </form>
    );
}
