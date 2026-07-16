'use client';

import axios from 'axios';
import { usePathname, useRouter } from 'next/navigation';
import { useRef } from 'react';

import { EmailField, PasswordField, UsernameField } from '@/components/auth/fields';
import { Tape, TOP_TICKS, BOTTOM_TICKS } from '@/components/tape';
import { useAuthSubmit } from '@/hooks/use-auth-submit';
import { useCandles } from '@/hooks/use-candles';
import { api } from '@/lib/api';
import { btnCls, errorCls, kickerCls, linkCls } from '@/lib/ui';

// Shared bits for the three sliding auth forms.
type Mode = 'login' | 'register' | 'reset';

const formCls =
    'flex-[0_0_33.3333%] box-border flex flex-col justify-center gap-[18px] px-[clamp(40px,7vw,120px)]';

const MODES: Mode[] = ['login', 'register', 'reset'];

// Reads the current auth mode from the URL and switches it by navigation.
function useAuthMode(): [Mode, (m: Mode) => void] {
    const router = useRouter();
    const pathname = usePathname();

    let mode: Mode = 'login';
    for (let i = 0; i < MODES.length; i++) {
        if (pathname === '/' + MODES[i]) {
            mode = MODES[i];
        }
    }

    function setMode(m: Mode) {
        router.push('/' + m);
    }

    return [mode, setMode];
}

// Kicker + title block that opens each auth form.
function FormHeading({ kicker, title }: { kicker: string; title: string }) {
    return (
        <div className="mb-2">
            <div className={`${kickerCls} mb-3`}>{kicker}</div>
            <h2 className="m-0 text-[30px] font-semibold tracking-[-0.01em] text-[#eef4f2]">
                {title}
            </h2>
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
        <p className="mt-1 mb-0 text-[13.5px] text-[#6b7a76] text-center">
            {text && <>{text} </>}
            <button type="button" onClick={onClick} className={`${linkCls} text-[13.5px]`}>
                {label}
            </button>
        </p>
    );
}

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
function LoginForm({ onSwitch }: { onSwitch: (m: Mode) => void }) {
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
            <FormHeading kicker="" title="Welcome back" />
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
function RegisterForm({ onSwitch }: { onSwitch: (m: Mode) => void }) {
    const router = useRouter();
    const { pending, error, onSubmit } = useAuthSubmit(registerAction, () =>
        router.push('/dashboard'),
    );

    return (
        <form onSubmit={onSubmit} className={formCls}>
            <FormHeading kicker="" title="Start your journal" />
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

// Password-recovery form.
function ResetForm({ onSwitch }: { onSwitch: (m: Mode) => void }) {
    // ponytail: reset form only preventDefaults — no backend endpoint exists yet.
    const noSubmit = (e: React.FormEvent) => e.preventDefault();

    return (
        <form onSubmit={noSubmit} className={formCls}>
            <FormHeading kicker="" title="Recover access" />
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

// Brand headline block over the animated chart.
function HeroCopy() {
    return (
        <div className="absolute inset-0 flex flex-col justify-between box-border px-[52px] py-11">
            <div className="flex items-center gap-2.5">
                <span className="w-[9px] h-[9px] rounded-full bg-[#2fd57f] animate-[tradelPulse_2.2s_ease-out_infinite]" />
                <span className="font-mono text-[13px] font-semibold tracking-[0.22em] text-[#e8efec]">
                    TRADEL
                </span>
            </div>
            <div className="flex flex-col gap-3.5">
                <h1 className="m-0 text-[clamp(36px,3.4vw,52px)] font-semibold leading-[1.12] tracking-[-0.015em] text-[#eef4f1]">
                    Every trade,
                    <br />
                    on the record.
                    <span className="inline-block w-[13px] h-[0.78em] bg-[#2fd57f] ml-[9px] align-[-2px] animate-[tradelBlink_1.1s_steps(1)_infinite]" />
                </h1>
                <p className="m-0 text-[15px] leading-[1.5] text-[#7e8d89] max-w-[360px]">
                    Log entries, exits, and the reasoning between them.
                </p>
            </div>
        </div>
    );
}

const paneEase = 'transition-transform duration-700 ease-[cubic-bezier(0.77,0,0.18,1)]';

// Visual half of the auth page: candlestick canvas + gradient + copy.
// Slides right when the register/reset forms are open.
function HeroPanel({ shifted }: { shifted: boolean }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useCandles(canvasRef);

    return (
        <div
            className={`absolute inset-y-0 left-0 w-1/2 overflow-hidden bg-[#07090b] z-[1] ${paneEase}`}
            style={{ transform: `translateX(${shifted ? '100%' : '0%'})` }}
        >
            <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full opacity-[0.92]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,9,11,0.3)_0%,rgba(7,9,11,0)_30%,rgba(7,9,11,0.9)_82%)]" />
            <HeroCopy />
        </div>
    );
}

const TRACK_X = { login: '0%', register: '-33.3334%', reset: '-66.6667%' };

// Form half of the auth page: sits right, swipes left over the visual,
// and slides the 3-form strip (login / register / reset) to the active mode.
function FormStrip({ mode, children }: { mode: Mode; children: React.ReactNode }) {
    const shifted = mode !== 'login';
    return (
        <div
            className={`absolute inset-y-0 left-1/2 w-1/2 overflow-hidden bg-[#0e1214] border-l border-[#1b2226] z-[2] ${paneEase}`}
            style={{ transform: `translateX(${shifted ? '-100%' : '0%'})` }}
        >
            <div
                className="flex w-[300%] h-full transition-transform duration-[650ms] ease-[cubic-bezier(0.77,0,0.18,1)]"
                style={{ transform: `translateX(${TRACK_X[mode]})` }}
            >
                {children}
            </div>
        </div>
    );
}

// Auth landing shell: /login, /register, /reset share this layout so only the
// URL changes on switch — the tapes/panels persist and keep sliding.
export default function AuthLayout() {
    const [mode, setMode] = useAuthMode();

    return (
        <div className="relative w-full h-screen min-h-[640px] bg-[#0b0e10] overflow-hidden">
            <Tape
                items={TOP_TICKS}
                duration="46s"
                className="absolute top-0 left-0 right-0 h-11 border-b border-[#1b2226]"
            />
            {/* middle band holds the two sliding panels, between the tapes */}
            <div className="absolute top-[45px] bottom-[45px] left-0 right-0 overflow-hidden">
                <HeroPanel shifted={mode !== 'login'} />
                <FormStrip mode={mode}>
                    <LoginForm onSwitch={setMode} />
                    <RegisterForm onSwitch={setMode} />
                    <ResetForm onSwitch={setMode} />
                </FormStrip>
            </div>
            <Tape
                items={BOTTOM_TICKS}
                duration="58s"
                reverse
                className="absolute bottom-0 left-0 right-0 h-11 border-t border-[#1b2226]"
            />
        </div>
    );
}
