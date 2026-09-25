'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { TradelLogo } from '@/components/brand/tradel-logo';
import { BOTTOM_TICKS, Tape, TOP_TICKS } from '@/components/tape';
import { Button } from '@/components/ui/button';
import { useCandles } from '@/features/auth/hooks/use-candles';
import { useSessionStore } from '@/features/auth/store';
import { errorCls } from '@/lib/ui';

import { useAuthMode, type Mode } from '../hooks/use-auth-mode';
import { LoginForm, RegisterForm, ResetForm } from './auth-forms';
import { GoogleAuthProvider } from './google-auth';

function HeroCopy() {
    return (
        <div className="absolute inset-0 flex flex-col justify-between box-border px-[52px] py-11">
            <div className="flex items-center gap-2.5">
                <span className="w-[9px] h-[9px] rounded-full bg-primary animate-[tradelPulse_2.2s_ease-out_infinite]" />
                <TradelLogo className="h-6 w-[101px]" />
            </div>
            <div className="flex flex-col gap-3.5">
                <h1 className="m-0 text-6xl! font-semibold leading-[1.05] tracking-[-0.02em] text-card-foreground">
                    Every trade,
                    <br />
                    on the record.
                    <span className="inline-block w-[13px] h-[0.9em] bg-primary ml-[9px] align-[-2px] animate-[tradelBlink_1.1s_steps(1)_infinite]" />
                </h1>
                <p className="m-0 text-ui-md leading-[1.5] text-content-soft max-w-[360px]">
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
            className={`absolute inset-y-0 left-0 z-[1] hidden w-1/2 overflow-hidden bg-background md:block ${paneEase}`}
            style={{ transform: `translateX(${shifted ? '100%' : '0%'})` }}
        >
            <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full opacity-[0.92]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(5_5_5/0.3)_0%,transparent_30%,rgb(5_5_5/0.9)_82%)]" />
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
            className={`absolute inset-y-0 left-0 z-[2] w-full translate-x-0 overflow-hidden border-border-subtle bg-background md:left-1/2 md:w-1/2 md:border-l ${paneEase} ${shifted ? 'md:-translate-x-full' : ''}`}
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

export default function AuthLayout() {
    const [mode, setMode] = useAuthMode();
    const router = useRouter();
    const restore = useSessionStore((state) => state.restore);
    const session = useSessionStore((state) => state.session);
    const restoring = useSessionStore((state) => state.restoring);
    const sessionStatus = session.status;
    const [signingInHere, setSigningInHere] = useState(false);
    const redirecting = sessionStatus === 'demo' || (sessionStatus === 'user' && !signingInHere);

    useEffect(() => {
        if (redirecting) {
            router.replace('/dashboard');
        } else if (sessionStatus === 'checking') {
            restore().catch(() => {
                // The session store records the error; consume the rejection here.
            });
        }
    }, [redirecting, restore, router, sessionStatus]);

    if (sessionStatus === 'checking' || redirecting) return null;
    if (session.status === 'error') {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background p-6">
                <div className="flex max-w-md flex-col items-center gap-4 text-center">
                    <h1 className="m-0 text-lg font-semibold text-card-foreground">
                        We couldn&apos;t verify your session
                    </h1>
                    <p className={errorCls} role="alert">
                        {session.message}
                    </p>
                    <Button
                        type="button"
                        onClick={() => restore().catch(() => undefined)}
                        disabled={restoring}
                    >
                        {restoring ? 'Trying again…' : 'Try again'}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <GoogleAuthProvider onAuthStart={() => setSigningInHere(true)}>
            <div className="relative h-screen min-h-[640px] w-full overflow-hidden bg-background">
                <Tape
                    items={TOP_TICKS}
                    duration="46s"
                    className="absolute top-0 left-0 right-0 h-11 border-b border-border-subtle"
                />
                {/* middle band holds the two sliding panels, between the tapes */}
                <div className="absolute top-[45px] bottom-[45px] left-0 right-0 overflow-hidden">
                    <HeroPanel shifted={mode !== 'login'} />
                    <FormStrip mode={mode}>
                        <LoginForm
                            onSwitch={setMode}
                            onSubmitStart={() => setSigningInHere(true)}
                        />
                        <RegisterForm
                            onSwitch={setMode}
                            onSubmitStart={() => setSigningInHere(true)}
                        />
                        <ResetForm onSwitch={setMode} />
                    </FormStrip>
                </div>
                <Tape
                    items={BOTTOM_TICKS}
                    duration="58s"
                    reverse
                    className="absolute bottom-0 left-0 right-0 h-11 border-t border-border-subtle"
                />
            </div>
        </GoogleAuthProvider>
    );
}
