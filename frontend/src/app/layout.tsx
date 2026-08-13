import type { Metadata } from 'next';
import { Sora } from 'next/font/google';
import { ReactScan } from '@/components/react-scan';
import './globals.css';

const sora = Sora({
    variable: '--font-sora',
    subsets: ['latin'],
    weight: ['400', '600', '700'],
    display: 'swap',
});

export const metadata: Metadata = {
    title: 'Tradel',
    description: 'Log entries, exits, and the reasoning between them.',
    icons: {
        icon: '/brand/tradel-mark.png',
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="en"
            className={`${sora.variable} h-full antialiased`}
            suppressHydrationWarning
        >
            <body className="min-h-full flex flex-col">
                <ReactScan />
                {children}
            </body>
        </html>
    );
}
