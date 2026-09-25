'use client';

import axios from 'axios';
import { Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FluxButton } from '@/components/ui/flux-button';
import { useAuthSubmit } from '@/features/auth/hooks/use-auth-submit';
import { useSessionStore } from '@/features/auth/store';
import { apiMessage } from '@/lib/api';
import { btnCls, errorCls, kickerCls, linkCls } from '@/lib/ui';
import { EmailField, PasswordField, UsernameField } from './fields';
import { GoogleSignInButton } from './google-auth';

import type { Mode } from '../hooks/use-auth-mode';

// Shared bits for the three sliding auth forms.

const formCls =
    'flex-[0_0_33.3333%] box-border flex flex-col items-center justify-center gap-[18px] px-6 sm:px-[clamp(40px,7vw,120px)] [&>*]:w-full [&>*]:max-w-[400px]';

const AUTH_SUCCESS_HOLD_MS = 900;
const DEFAULT_RETRY_SECONDS = 60;
const MAX_RETRY_SECONDS = 15 * 60;

function getRetryAfterSeconds(value: unknown): number {
    const seconds = Number(value);

    if (!Number.isFinite(seconds) || seconds <= 0) {
        return DEFAULT_RETRY_SECONDS;
    }

    return Math.min(Math.ceil(seconds), MAX_RETRY_SECONDS);
}

function FluxSubmit({
    idleLabel,
    loadingLabel,
    successLabel,
    onAction,
    disabled = false,
}: {
    idleLabel: string;
    loadingLabel: string;
    successLabel: string;
    onAction: () => Promise<void>;
    disabled?: boolean;
}) {
    return (
        <div className="h-[38px] w-full">
            <FluxButton
                type="button"
                disabled={disabled}
                idleLabel={idleLabel}
                loadingLabel={loadingLabel}
                successLabel={successLabel}
                successIcon={<Check aria-hidden />}
                successHold={AUTH_SUCCESS_HOLD_MS}
                onAction={onAction}
                className={`${btnCls} h-[38px] text-ui-sm`}
                style={{ height: 38, minWidth: '100%', width: '100%' }}
            />
        </div>
    );
}

// Kicker + title block that opens each auth form.
function FormHeading({ kicker, title }: { kicker: string; title: string }) {
    return (
        <div className="mb-2">
            <div className={`${kickerCls} mb-3`}>{kicker}</div>
            <h2 className="m-0 text-[clamp(26px,2.4vw,34px)] font-semibold tracking-[-0.01em] text-card-foreground">
                {title}
            </h2>
        </div>
    );
}

function AuthDivider() {
    return (
        <div className="flex items-center gap-3 text-content-faint" aria-hidden="true">
            <span className="h-px flex-1 bg-border-subtle" />
            <span className="font-mono text-ui-xs uppercase tracking-[0.14em]">or</span>
            <span className="h-px flex-1 bg-border-subtle" />
        </div>
    );
}

// Footer line that switches between the auth forms ("New to Tradel? ...").
function SwitchLine({
    text,
    label,
    onClick,
}: {
    text?: string;
    label: string;
    onClick: () => void;
}) {
    return (
        <p className="mt-1 mb-0 text-center text-ui-md text-content-faint">
            {text && <>{text} </>}
            <Button
                type="button"
                variant="link"
                onClick={onClick}
                className={`${linkCls} h-auto text-ui-md`}
            >
                {label}
            </Button>
        </p>
    );
}

// Remember-me checkbox + forgot-password link row.
function RememberRow({ onReset }: { onReset: () => void }) {
    return (
        <div className="flex justify-between items-center">
            <label
                htmlFor="remember-me"
                className="flex items-center gap-2 text-ui-sm text-content-muted cursor-pointer"
            >
                <Checkbox id="remember-me" name="remember" />
                Remember me
            </label>
            <Button
                type="button"
                variant="link"
                onClick={onReset}
                className={`${linkCls} h-auto text-ui-sm`}
            >
                Forgot password?
            </Button>
        </div>
    );
}

// Sign-in form; owns its own submit/pending/error state.
export function LoginForm({
    onSwitch,
    onSubmitStart,
}: {
    onSwitch: (m: Mode) => void;
    onSubmitStart: () => void;
}) {
    const router = useRouter();
    const formRef = useRef<HTMLFormElement>(null);
    const [retryIn, setRetryIn] = useState(0);
    const login = useSessionStore((state) => state.login);
    const sessionPending = useSessionStore((state) => state.pendingAction !== null);

    useEffect(() => {
        if (retryIn <= 0) return;

        const timer = window.setTimeout(() => {
            setRetryIn((seconds) => Math.max(0, seconds - 1));
        }, 1_000);

        return () => window.clearTimeout(timer);
    }, [retryIn]);

    const { error, submit } = useAuthSubmit(
        async (f) => {
            const email = f.get('email') as string;
            const password = f.get('password') as string;
            try {
                await login({ email, password });
            } catch (err) {
                if (axios.isAxiosError(err) && err.response?.status === 429) {
                    const seconds = getRetryAfterSeconds(err.response.headers['retry-after']);
                    setRetryIn(seconds);
                    throw new Error('Too many sign-in attempts.');
                }

                throw new Error(apiMessage(err));
            }
        },
        () => {
            window.setTimeout(() => router.push('/dashboard'), AUTH_SUCCESS_HOLD_MS);
        },
    );

    const submitLogin = () => {
        if (!formRef.current) return Promise.reject(new Error('Login form is unavailable'));
        if (!formRef.current.reportValidity()) {
            return Promise.reject(new Error('Please complete the required fields'));
        }
        onSubmitStart();
        return submit(new FormData(formRef.current));
    };

    return (
        <form ref={formRef} className={formCls}>
            <FormHeading kicker="" title="Welcome back" />
            <EmailField />
            <PasswordField />
            <RememberRow onReset={() => onSwitch('reset')} />
            {error && (
                <p className={errorCls} role="alert">
                    {error}
                </p>
            )}
            <FluxSubmit
                idleLabel={retryIn > 0 ? `Sign in again in ${retryIn}s` : 'Sign in'}
                loadingLabel="Signing in"
                successLabel="Signed in"
                onAction={submitLogin}
                disabled={retryIn > 0 || sessionPending}
            />
            <AuthDivider />
            <GoogleSignInButton />
            <SwitchLine
                text="New to Tradel?"
                label="Create an account"
                onClick={() => onSwitch('register')}
            />
        </form>
    );
}

// Account-creation form; owns its own submit/pending/error state.
export function RegisterForm({
    onSwitch,
    onSubmitStart,
}: {
    onSwitch: (m: Mode) => void;
    onSubmitStart: () => void;
}) {
    const router = useRouter();
    const formRef = useRef<HTMLFormElement>(null);
    const register = useSessionStore((state) => state.register);
    const sessionPending = useSessionStore((state) => state.pendingAction !== null);
    const registerAction = async (form: FormData) => {
        try {
            await register({
                username: form.get('username') as string,
                email: form.get('email') as string,
                password: form.get('password') as string,
            });
        } catch (error) {
            throw new Error(apiMessage(error));
        }
    };
    const { error, submit } = useAuthSubmit(registerAction, () => {
        window.setTimeout(() => router.push('/dashboard'), AUTH_SUCCESS_HOLD_MS);
    });

    const submitRegistration = () => {
        if (!formRef.current) return Promise.reject(new Error('Registration form is unavailable'));
        if (!formRef.current.reportValidity()) {
            return Promise.reject(new Error('Please complete the required fields'));
        }
        onSubmitStart();
        return submit(new FormData(formRef.current));
    };

    return (
        <form ref={formRef} className={formCls}>
            <FormHeading kicker="" title="Start your journal" />

            <UsernameField />
            <EmailField />
            <PasswordField strong />
            {error && <p className={errorCls}>{error}</p>}
            <FluxSubmit
                idleLabel="Create account"
                loadingLabel="Creating account"
                successLabel="Account created"
                disabled={sessionPending}
                onAction={submitRegistration}
            />
            <AuthDivider />
            <GoogleSignInButton />
            <SwitchLine
                text="Already have an account?"
                label="Sign in"
                onClick={() => onSwitch('login')}
            />
        </form>
    );
}

// Password-recovery form.
export function ResetForm({ onSwitch }: { onSwitch: (m: Mode) => void }) {
    // ponytail: reset form only preventDefaults — no backend endpoint exists yet.
    const noSubmit = (e: React.FormEvent) => e.preventDefault();

    return (
        <form onSubmit={noSubmit} className={formCls}>
            <FormHeading kicker="" title="Recover access" />
            <p className="m-0 text-sm leading-[1.55] text-muted-foreground">
                Enter the email tied to your account and we&rsquo;ll send a secure reset link.
            </p>
            <EmailField />
            <Button type="submit" className={btnCls}>
                Send reset link
            </Button>
            <SwitchLine label="← Back to sign in" onClick={() => onSwitch('login')} />
        </form>
    );
}

// Brand headline block over the animated chart.
