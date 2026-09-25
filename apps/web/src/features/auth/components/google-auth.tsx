'use client';

import Script from 'next/script';
import { useRouter } from 'next/navigation';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import { useSessionStore } from '@/features/auth/store';
import { apiMessage } from '@/lib/api';
import { errorCls } from '@/lib/ui';

interface GoogleCredentialResponse {
    credential?: string;
}

interface GoogleButtonOptions {
    type: 'standard';
    theme: 'outline';
    size: 'large';
    text: 'continue_with';
    shape: 'rectangular';
    logo_alignment: 'center';
    width: number;
}

interface GoogleIdentityApi {
    initialize(options: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
    }): void;
    renderButton(element: HTMLElement, options: GoogleButtonOptions): void;
}

declare global {
    interface Window {
        google?: {
            accounts: {
                id: GoogleIdentityApi;
            };
        };
    }
}

interface GoogleAuthContextValue {
    ready: boolean;
    pending: boolean;
    error: string | null;
    renderButton: (element: HTMLElement) => void;
}

const GoogleAuthContext = createContext<GoogleAuthContextValue | null>(null);

function useGoogleAuth() {
    const context = useContext(GoogleAuthContext);
    if (!context) {
        throw new Error('GoogleSignInButton must be used inside GoogleAuthProvider');
    }
    return context;
}

export function GoogleAuthProvider({
    children,
    onAuthStart,
}: {
    children: React.ReactNode;
    onAuthStart: () => void;
}) {
    const router = useRouter();
    const googleLogin = useSessionStore((state) => state.googleLogin);
    const pending = useSessionStore((state) => state.pendingAction !== null);
    const initializedRef = useRef(false);
    const [ready, setReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCredential = useCallback(
        async (credential: string | undefined) => {
            if (!credential) {
                setError('Google did not return a sign-in credential.');
                return;
            }

            setError(null);
            onAuthStart();

            try {
                await googleLogin(credential);
                router.push('/dashboard');
            } catch (requestError) {
                setError(apiMessage(requestError));
            }
        },
        [googleLogin, onAuthStart, router],
    );

    const initializeGoogle = useCallback(() => {
        if (initializedRef.current) return;

        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        const googleIdentity = window.google?.accounts.id;

        if (!clientId) {
            setError('Google sign-in is not configured.');
            return;
        }

        if (!googleIdentity) {
            setError('Google sign-in could not be loaded.');
            return;
        }

        googleIdentity.initialize({
            client_id: clientId,
            callback: ({ credential }) => {
                void handleCredential(credential);
            },
        });

        initializedRef.current = true;
        setReady(true);
    }, [handleCredential]);

    const renderButton = useCallback(
        (element: HTMLElement) => {
            const googleIdentity = window.google?.accounts.id;
            if (!ready || !googleIdentity) return;

            element.replaceChildren();
            googleIdentity.renderButton(element, {
                type: 'standard',
                theme: 'outline',
                size: 'large',
                text: 'continue_with',
                shape: 'rectangular',
                logo_alignment: 'center',
                width: 400,
            });
        },
        [ready],
    );

    const context = useMemo(
        () => ({ ready, pending, error, renderButton }),
        [error, pending, ready, renderButton],
    );

    return (
        <GoogleAuthContext.Provider value={context}>
            <Script
                id="google-identity-services"
                src="https://accounts.google.com/gsi/client"
                strategy="afterInteractive"
                onReady={initializeGoogle}
            />
            {children}
        </GoogleAuthContext.Provider>
    );
}

export function GoogleSignInButton() {
    const { ready, pending, error, renderButton } = useGoogleAuth();
    const buttonRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (buttonRef.current) renderButton(buttonRef.current);
    }, [ready, renderButton]);

    return (
        <div className="flex w-full flex-col items-center gap-2">
            <div
                className={`flex h-11 w-full justify-center ${pending ? 'pointer-events-none opacity-60' : ''}`}
                aria-busy={!ready || pending}
            >
                <div
                    ref={buttonRef}
                    className="h-11 w-full max-w-[400px] overflow-hidden rounded-lg bg-white [clip-path:inset(0_round_10px)]"
                >
                    {!ready && !error && (
                        <div
                            className="h-full w-full animate-pulse rounded-lg border border-border bg-white/90"
                            aria-hidden="true"
                        />
                    )}
                </div>
            </div>
            {error && (
                <p className={errorCls} role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}
