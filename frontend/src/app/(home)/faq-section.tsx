import { FaqPro, type FaqProItem } from '@/components/ui/faq-pro';

import { LandingSection, LandingSectionHeading } from './landing-section';

const FAQ_ITEMS: FaqProItem[] = [
    {
        id: 'what-is-tradel',
        question: 'What does Tradel provide?',
        answer:
            'Tradel gives you one place to log trades, organize multiple trading accounts, attach notes to your decisions, and review equity, daily P&L, calendar performance, and analytics by symbol and direction.',
        keywords: ['features', 'journal', 'analytics', 'calendar', 'accounts'],
    },
    {
        id: 'why-journal',
        question: 'Why should I use a trading journal?',
        answer:
            'A journal turns isolated wins and losses into patterns you can study. Tradel helps you see what is working, where discipline slips, and which setups deserve more or less of your attention.',
        keywords: ['benefits', 'discipline', 'patterns', 'improve', 'edge'],
    },
    {
        id: 'is-free',
        question: 'Is Tradel free to use?',
        answer:
            'Yes. The current version lets you create an account and use the trading journal for free. You can also explore a populated live demo without registering.',
        keywords: ['pricing', 'price', 'cost', 'subscription', 'demo'],
    },
    {
        id: 'beginner-friendly',
        question: 'Is Tradel suitable for new traders?',
        answer:
            'Yes. Tradel is designed to make review straightforward: record the trade, add the reasoning behind it, then use clear charts and summaries to learn from the result.',
        keywords: ['beginner', 'new trader', 'getting started', 'simple'],
    },
    {
        id: 'multiple-accounts',
        question: 'Can I keep different trading accounts separate?',
        answer:
            'Yes. You can create multiple accounts for personal trading, demo accounts, or prop-firm challenges, and give each one its own broker, balance, and currency.',
        keywords: ['broker', 'prop firm', 'demo', 'currency', 'portfolio'],
    },
    {
        id: 'trade-execution',
        question: 'Does Tradel place trades for me?',
        answer:
            'No. Tradel is a journal and performance-review platform, not a broker or trade-execution service. You stay in control of every trading decision and use Tradel to record and analyze the outcome.',
        keywords: ['broker', 'execute', 'signals', 'automation', 'connect'],
    },
    {
        id: 'getting-started',
        question: 'How do I get started?',
        answer:
            'Open the live demo to explore a complete journal immediately, or create a free account, add your first trading account, and log a closed trade to begin building your performance history.',
        keywords: ['signup', 'register', 'demo', 'first trade', 'account'],
    },
];

export function FaqSection() {
    return (
        <LandingSection id="faq">
            <LandingSectionHeading
                eyebrow="New to Tradel?"
                title="Questions before your first trade log"
                description="Understand what the platform does, why journaling matters, and how to get started."
            />
            <FaqPro
                items={FAQ_ITEMS}
                defaultOpenFirst
                searchPlaceholder="Search Tradel questions..."
                noResultsMessage="No matching Tradel questions."
                themed={false}
                size="default"
                className="mt-10 max-w-[860px] sm:mt-12"
            />
        </LandingSection>
    );
}
