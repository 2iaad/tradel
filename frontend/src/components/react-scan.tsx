'use client';

import { useEffect } from 'react';

// Dev-only render profiler. Dynamic import so react-scan never ships in the
// production bundle (the NODE_ENV check is compiled away in prod builds).
export function ReactScan() {
    useEffect(() => {
        if (process.env.NODE_ENV !== 'development') return;
        import('react-scan').then(({ scan }) =>
            scan({ enabled: true, log: true, trackUnnecessaryRenders: true }),
        );
    }, []);
    return null;
}
