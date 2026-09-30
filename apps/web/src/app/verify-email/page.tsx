'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { api, apiMessage } from '@/lib/api';

type Status = 'verifying' | 'success' | 'error';

export default function VerifyEmailPage() {
    const started = useRef(false);
    const [status, setStatus] = useState<Status>('verifying');
    const [message, setMessage] = useState('Verifying your email…');

    useEffect(() => {
        if (started.current) return;
        started.current = true;

        const verifyEmail = async () => {
            const params = new URLSearchParams(window.location.hash.slice(1));
            const token = params.get('token');

            if (!token) {
                throw new Error('The verification link is missing its token.');
            }

            await api.post('/auth/verify-email', { token });
        };

        void verifyEmail()
            .then(() => {
                window.history.replaceState(null, '', '/verify-email');
                setStatus('success');
                setMessage('Your email is verified. You can now sign in.');
            })
            .catch((error) => {
                setStatus('error');
                setMessage(apiMessage(error));
            });
    }, []);

    return (
        <main className="flex min-h-screen items-center justify-center bg-background p-6">
            <section className="w-full max-w-md rounded-lg border border-border bg-card p-8 text-center">
                <h1 className="text-2xl font-semibold text-card-foreground">Email verification</h1>
                <p
                    className="mt-4 text-sm text-muted-foreground"
                    role={status === 'error' ? 'alert' : 'status'}
                >
                    {message}
                </p>
                {status !== 'verifying' && (
                    <Link className="mt-6 inline-block text-primary hover:underline" href="/login">
                        Go to sign in
                    </Link>
                )}
            </section>
        </main>
    );
}
