'use client';

import axios from 'axios';
import { useRouter } from 'next/navigation';

import { api } from '@/lib/api';
import { btnCls, errorCls, linkCls } from '@/lib/ui';
import { useAuthSubmit } from '@/hooks/use-auth-submit';
import { Mode, formCls } from './common';
import { EmailField } from './email-field';
import { FormHeading } from './form-heading';
import { PasswordField } from './password-field';
import { SwitchLine } from './switch-line';

// Remember-me checkbox + forgot-password link row.
function RememberRow({ onReset }: { onReset: () => void }) {
    return (
        <div className="flex justify-between items-center">
            <label className="flex items-center gap-2 text-[13px] text-[#93a09d] cursor-pointer">
                <input type="checkbox" className="accent-[#2fd57f] w-[15px] h-[15px] m-0" />
                Remember me
            </label>
            <button type="button" onClick={onReset} className={`${linkCls} text-[13px]`}>
                Forgot password?
            </button>
        </div>
    );
}

// Sign-in form; owns its own submit/pending/error state.
export function LoginForm({ onSwitch }: { onSwitch: (m: Mode) => void }) {
    const router = useRouter();
    
    const { pending, error, onSubmit } = useAuthSubmit(async (f) => {
        const email = f.get('email') as string;
        const password = f.get('password') as string;
        try {
            const { data } = await api.post('/auth/login', { email, password });
            return data;
        } catch (err) {
            const m = axios.isAxiosError(err) ? err.response?.data?.message : null;
            throw new Error(Array.isArray(m) ? m[0] : (m ?? 'Something went wrong'));
        }
    }, () => router.push('/dashboard'));

    return (
        <form onSubmit={onSubmit} className={formCls}>
            <FormHeading kicker="/// SIGN IN" title="Welcome back" />
            <EmailField />
            <PasswordField />
            <RememberRow onReset={() => onSwitch('reset')} />
            {error && <p className={errorCls}>{error}</p>}
            <button type="submit" disabled={pending} className={btnCls}>
                Sign in
            </button>
            <SwitchLine
                text="New to Tradel?"
                label="Create an account"
                onClick={() => onSwitch('register')}
            />
        </form>
    );
}
