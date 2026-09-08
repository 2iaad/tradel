'use client';

import { useRef, useState } from 'react';

export type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error';

// Wraps an auth API call in form-submit handling with pending/error state.
// Native HTML validation gates submit, so errors here are server errors.
export function useAuthSubmit(action: (f: FormData) => Promise<unknown>, onSuccess: () => void) {
    const [status, setStatus] = useState<SubmitStatus>('idle');
    const [error, setError] = useState<string | null>(null);
    const submittingRef = useRef(false);

    const submit = async (formData: FormData) => {
        if (submittingRef.current) return;

        submittingRef.current = true;
        setStatus('submitting');
        setError(null);

        try {
            await action(formData);
            setStatus('success');
            onSuccess();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
            setStatus('error');
            submittingRef.current = false;
            throw err;
        }
    };

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        submit(new FormData(e.currentTarget)).catch(() => undefined);
    };

    return {
        pending: status === 'submitting' || status === 'success',
        status,
        error,
        submit,
        onSubmit,
        clearError: () => setError(null),
    };
}
