'use client';

import { Mode } from './common';

const paneEase = 'transition-transform duration-700 ease-[cubic-bezier(0.77,0,0.18,1)]';
const TRACK_X = { login: '0%', register: '-33.3334%', reset: '-66.6667%' };

// Form half of the auth page: sits right, swipes left over the visual,
// and slides the 3-form strip (login / register / reset) to the active mode.
export function FormStrip({ mode, children }: { mode: Mode; children: React.ReactNode }) {
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
