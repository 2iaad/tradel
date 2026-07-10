import { kickerCls } from '@/lib/ui';

// Mono green section kicker revealed on scroll.
export function Kicker({ children }: { children: React.ReactNode }) {
    return (
        <div data-reveal="up" className={kickerCls}>
            {children}
        </div>
    );
}
