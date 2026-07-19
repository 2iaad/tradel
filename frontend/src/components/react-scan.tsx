'use client';

import { useEffect } from 'react';

// Dev-only render profiler. Dynamic import so react-scan never ships in the
// production bundle (the NODE_ENV check is compiled away in prod builds).
export function ReactScan() {
    useEffect(() => {
        // opt-in only: NEXT_PUBLIC_REACT_SCAN=1 npm run dev
        if (process.env.NODE_ENV !== 'development') return;
        if (process.env.NEXT_PUBLIC_REACT_SCAN !== '1') return;
        import('react-scan').then(({ scan }) =>
            scan({ enabled: true, log: true, trackUnnecessaryRenders: true }),
        );
    }, []);
    return null;
}
