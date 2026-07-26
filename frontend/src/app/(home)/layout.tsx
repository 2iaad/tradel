import type { Metadata } from 'next';

import '../../styles/swiper.css';
import '../../styles/site.css';
import '../../styles/tradel.css';

export const metadata: Metadata = {
    title: 'Tradel — AI-powered trading agents',
    description: 'Create, direct, and evolve autonomous AI trading agents in one conversation.',
    robots: { index: false, follow: false, noarchive: true },
};

export default function HomeLayout({ children }: { children: React.ReactNode }) {
    return children;
}
