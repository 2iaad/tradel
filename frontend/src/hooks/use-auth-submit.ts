'use client';

import { useState } from 'react';

// Wraps an auth API call in form-submit handling with pending/error state.
// Native HTML validation gates submit, so errors here are server errors.
export function useAuthSubmit(action: (f: FormData) => Promise<unknown>, onSuccess: () => void) {
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setPending(true);
        setError(null);
        try {
            await action(new FormData(e.currentTarget));
            onSuccess(); // pending stays true while navigating/reloading
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
            setPending(false);
        }
    };

    return { pending, error, onSubmit, clearError: () => setError(null) };
}
