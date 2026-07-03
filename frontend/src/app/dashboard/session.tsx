'use client';

import { createContext, useContext } from 'react';

export type Session =
    | { status: 'checking'; email: null }
    | { status: 'guest'; email: null }
    | { status: 'user'; email: string };

export const SessionContext = createContext<Session>({
    status: 'checking',
    email: null,
});

export const useSession = () => useContext(SessionContext);
