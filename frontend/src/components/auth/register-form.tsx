'use client';

import axios from 'axios';
import { useRouter } from 'next/navigation';

import { api } from '@/lib/api';
import { btnCls, errorCls } from '@/lib/ui';
import { useAuthSubmit } from '@/hooks/use-auth-submit';
import { Mode, formCls } from './common';
import { EmailField } from './email-field';
import { FormHeading } from './form-heading';
import { PasswordField } from './password-field';
import { SwitchLine } from './switch-line';
import { UsernameField } from './username-field';

async function registerAction(f: FormData) {
    const username = f.get('username') as string;
    const email = f.get('email') as string;
    const password = f.get('password') as string;
    try {
        const { data } = await api.post('/auth/register', { username, email, password });
        return data;
    } catch (err) {
        const m = axios.isAxiosError(err) ? err.response?.data?.message : null;
        throw new Error(Array.isArray(m) ? m[0] : (m ?? 'Something went wrong'));
    }
}

// Account-creation form; owns its own submit/pending/error state.
export function RegisterForm({ onSwitch }: { onSwitch: (m: Mode) => void }) {
    const router = useRouter();
    const { pending, error, onSubmit } = useAuthSubmit(registerAction, () =>
        router.push('/dashboard'),
    );

    return (
        <form onSubmit={onSubmit} className={formCls}>
            <FormHeading kicker="/// CREATE ACCOUNT" title="Start your journal" />
            <UsernameField />
            <EmailField />
            <PasswordField strong />
            {error && <p className={errorCls}>{error}</p>}
            <button type="submit" disabled={pending} className={btnCls}>
                Create account
            </button>
            <SwitchLine
                text="Already have an account?"
                label="Sign in"
                onClick={() => onSwitch('login')}
            />
        </form>
    );
}
