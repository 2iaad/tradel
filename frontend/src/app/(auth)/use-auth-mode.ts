'use client';

import { usePathname, useRouter } from 'next/navigation';

import { Mode } from '@/components/auth/common';

const MODES: Mode[] = ['login', 'register', 'reset'];

// Reads the current auth mode from the URL and switches it by navigation.
export function useAuthMode(): [Mode, (m: Mode) => void] {
    const router = useRouter();
    const pathname = usePathname();
    const mode = MODES.find((m) => pathname === `/${m}`) ?? 'login';
    return [mode, (m: Mode) => router.push(`/${m}`)];
}
