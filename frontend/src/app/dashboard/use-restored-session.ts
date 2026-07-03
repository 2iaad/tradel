'use client';

import { useEffect, useState } from 'react';

import { restoreSession } from '@/lib/api';
import { emailFromToken } from '@/lib/format';
import { Session } from './session';

// Bootstraps the session from the refresh cookie on mount.
export function useRestoredSession(): Session {
    const [session, setSession] = useState<Session>({
        status: 'checking',
        email: null,
    });

    useEffect(() => {
        restoreSession().then((token) => {
            const email = token && emailFromToken(token);
            setSession(email ? { status: 'user', email } : { status: 'guest', email: null });
        });
    }, []);

    return session;
}
