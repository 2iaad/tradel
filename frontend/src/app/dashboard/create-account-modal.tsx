'use client';

import axios from 'axios';
import Link from 'next/link';

import { api } from '@/lib/api';
import { btnCls, errorCls, kickerCls, linkCls } from '@/lib/ui';
import { useAuthSubmit } from '@/hooks/use-auth-submit';
import { EmailField, PasswordField, UsernameField } from '@/components/auth/fields';

// Modal title row with the close button.
function ModalHeader({ onClose }: { onClose: () => void }) {
    return (
        <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-2.5">
                <h2 className="m-0 text-2xl font-semibold tracking-[-0.01em] text-[#eef4f2]">
                    Start your journal
                </h2>
            </div>
            <button
                type="button"
                onClick={onClose}
                className="bg-transparent border-none p-0.5 text-[#5f6b70] text-lg leading-none cursor-pointer hover:text-[#eef4f2]"
            >
                ×
            </button>
        </div>
    );
}

// Signup form; reloads on success to flip the layout to the signed-in
// dashboard (the refresh cookie is set by then).
function SignupForm() {
    const { pending, error, onSubmit } = useAuthSubmit(async (f) => {
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
    }, () => location.reload());

    return (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <UsernameField />
            <EmailField />
            <PasswordField strong />
            {error && <p className={errorCls}>{error}</p>}
            <button type="submit" disabled={pending} className={btnCls}>
                Create free account
            </button>
            <p className="m-0 text-[13px] text-[#6b7a76] text-center">
                Already have an account?{' '}
                <Link href="/" className={`${linkCls} no-underline text-[13px]`}>
                    Sign in
                </Link>
            </p>
        </form>
    );
}

// Guest-dashboard signup modal.
export function CreateAccountModal({ onClose }: { onClose: () => void }) {
    return (
        <div
            onClick={onClose}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(4,6,8,0.7)] backdrop-blur-[6px] animate-[tradelFadeIn_0.25s_ease]"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="w-[400px] max-w-[calc(100vw-48px)] box-border bg-[#0e1214] border border-[#222a2f] rounded-xl px-[30px] py-7 flex flex-col gap-[18px] animate-[tradelPopIn_0.3s_cubic-bezier(0.34,1.4,0.44,1)]"
            >
                <ModalHeader onClose={onClose} />
                <SignupForm />
            </div>
        </div>
    );
}
