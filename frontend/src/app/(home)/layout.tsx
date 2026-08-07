import type { Metadata } from 'next';

import '../../styles/home-theme.css';

export const metadata: Metadata = {
    title: 'Tradel | AI-powered trading journal',
    description: 'Log your trades, see your progress.',
    robots: { index: false, follow: false, noarchive: true },
};

export default function HomeLayout({ children }: { children: React.ReactNode }) {
    return children;
}
