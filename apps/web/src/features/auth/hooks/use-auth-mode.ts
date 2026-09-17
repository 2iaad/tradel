'use client';

import { usePathname, useRouter } from 'next/navigation';
export type Mode = 'login' | 'register' | 'reset';
const MODES: Mode[] = ['login', 'register', 'reset'];

// Reads the current auth mode from the URL and switches it by navigation.
export function useAuthMode(): [Mode, (m: Mode) => void] {
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
