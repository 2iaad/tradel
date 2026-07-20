// Content data for the home page sections.

export const NAV_LINKS = ['AI', 'blog', 'Academy', 'Earn'];

export const MENU_LINKS = ['AI', 'Blog', 'ACADEMY', 'EARN'];

export type Locale = {
    code: string;
    name: string;
};

export const LOCALES: Locale[] = [
    { code: 'en', name: 'English' },
    { code: 'pt-BR', name: 'Portuguese (Brazil)' },
    { code: 'ru', name: 'Russian' },
    { code: 'nl', name: 'Dutch' },
    { code: 'de', name: 'German' },
];

export type BlogPost = {
    title: string;
    image: string;
    date: string;
    category?: string;
};

export const NEWS_POSTS: BlogPost[] = [
    {
        title: 'What Is an AI Trading Agent? Complete Guide 2026',
        image: '/images/cdn/5247e636f6c7202c7224023c_1_AI-Trading-Agent.png',
        date: 'April 21, 2026',
        category: 'Crypto',
    },
    {
        title: 'Backtesting Trading Strategies: A Practical Guide with Real Examples',
        image: '/images/cdn/47ab28c463c5ff41dd5b3b3a_1_Backtesting-Trading-Strategies.png',
        date: 'April 15, 2026',
        category: 'Crypto',
    },
    {
        title: 'AI Agents in Crypto Trading FAQ: What They Are + How to Use Them',
        image: '/images/cdn/ai_agents_in_crypto_trading_faq_1.png',
        date: 'April 13, 2026',
        category: 'Crypto',
    },
];

export type SocialChannel = {
    name: string;
    viewBox: string;
    path: string;
    evenodd?: boolean;
    count: string;
    caption?: string;
};

export const SOCIAL_CHANNELS: SocialChannel[] = [
    {
        name: 'x',
        viewBox: '0 0 23 21',
        path: 'M17.8263 0.903809H21.1998L13.8297 9.3273L22.5 20.7898H15.7112L10.394 13.8378L4.30995 20.7898H0.934432L8.81743 11.7799L0.5 0.903809H7.46111L12.2674 7.25814L17.8263 0.903809ZM16.6423 18.7706H18.5116L6.44539 2.81694H4.43946L16.6423 18.7706Z',
        count: '39k',
        caption: 'Subscribers',
    },
    {
        name: 'Telegram',
        viewBox: '0 0 23 19',
        path: 'M2.01239 7.84883C7.91795 5.27585 11.8559 3.57959 13.8263 2.76003C19.4521 0.420046 20.6211 0.0135654 21.383 0.000143111C21.5506 -0.00280896 21.9253 0.0387227 22.168 0.235669C22.373 0.401967 22.4294 0.626612 22.4563 0.78428C22.4833 0.941949 22.5169 1.30112 22.4902 1.58177C22.1854 4.78504 20.8662 12.5585 20.1951 16.1462C19.9111 17.6643 19.352 18.1733 18.8107 18.2231C17.6343 18.3314 16.7409 17.4457 15.6015 16.6988C13.8186 15.53 12.8113 14.8025 11.0807 13.662C9.08058 12.3439 10.3772 11.6195 11.517 10.4356C11.8153 10.1258 16.9986 5.41117 17.0989 4.98348C17.1115 4.92999 17.1231 4.7306 17.0046 4.62532C16.8862 4.52004 16.7114 4.55604 16.5852 4.58467C16.4064 4.62526 13.5581 6.50789 8.04035 10.2326C7.23187 10.7877 6.49958 11.0582 5.84347 11.044C5.12016 11.0284 3.7288 10.6351 2.69447 10.2988C1.42583 9.88646 0.41753 9.66842 0.50533 8.96806C0.551061 8.60326 1.05341 8.23019 2.01239 7.84883Z',
        evenodd: true,
        count: '98k',
    },
    {
        name: 'discord',
        viewBox: '0 0 25 19',
        path: 'M20.817 2.15557C19.2873 1.45369 17.647 0.936576 15.9319 0.640403C15.9007 0.634687 15.8695 0.648971 15.8534 0.677541C15.6424 1.05276 15.4087 1.54226 15.2451 1.927C13.4004 1.65083 11.5652 1.65083 9.75832 1.927C9.59465 1.5337 9.35248 1.05276 9.14057 0.677541C9.12448 0.649924 9.09328 0.63564 9.06205 0.640403C7.34791 0.93563 5.70756 1.45275 4.17693 2.15557C4.16368 2.16129 4.15233 2.17082 4.14479 2.18319C1.03339 6.83155 0.18105 11.3657 0.59918 15.8436C0.601072 15.8655 0.61337 15.8864 0.630398 15.8997C2.68321 17.4073 4.67171 18.3225 6.62328 18.9291C6.65451 18.9386 6.68761 18.9272 6.70748 18.9015C7.16913 18.2711 7.58064 17.6063 7.93348 16.9073C7.9543 16.8664 7.93442 16.8178 7.89186 16.8016C7.23913 16.554 6.6176 16.2521 6.01973 15.9093C5.97244 15.8816 5.96865 15.814 6.01216 15.7816C6.13797 15.6873 6.26382 15.5893 6.38396 15.4902C6.40569 15.4721 6.43598 15.4683 6.46153 15.4797C10.3893 17.273 14.6415 17.273 18.523 15.4797C18.5485 15.4674 18.5788 15.4712 18.6015 15.4893C18.7216 15.5883 18.8475 15.6873 18.9742 15.7816C19.0177 15.814 19.0149 15.8816 18.9676 15.9093C18.3697 16.2588 17.7482 16.554 17.0945 16.8006C17.052 16.8168 17.033 16.8664 17.0538 16.9073C17.4143 17.6054 17.8258 18.2701 18.2789 18.9005C18.2978 18.9272 18.3319 18.9386 18.3631 18.9291C20.3241 18.3225 22.3126 17.4073 24.3654 15.8997C24.3834 15.8864 24.3948 15.8664 24.3967 15.8445C24.8971 10.6676 23.5585 6.17064 20.8482 2.18414C20.8416 2.17082 20.8303 2.16129 20.817 2.15557ZM8.52002 13.117C7.3375 13.117 6.36313 12.0313 6.36313 10.6981C6.36313 9.36477 7.3186 8.27912 8.52002 8.27912C9.73087 8.27912 10.6958 9.3743 10.6769 10.6981C10.6769 12.0313 9.72141 13.117 8.52002 13.117ZM16.4947 13.117C15.3123 13.117 14.3379 12.0313 14.3379 10.6981C14.3379 9.36477 15.2933 8.27912 16.4947 8.27912C17.7056 8.27912 18.6705 9.3743 18.6516 10.6981C18.6516 12.0313 17.7056 13.117 16.4947 13.117Z',
        count: '32k',
    },
];

export type PressQuote = {
    outlet: string;
    logo: string;
    quote: string;
};

export const PRESS_QUOTES: PressQuote[] = [
    {
        outlet: 'Bitconist',
        logo: '/images/cdn/694cce9e357b875e39f4be05_bitconist.svg',
        quote: 'Tradel’s AI agents function as tireless market analysts that never need sleep. “Imagine having a pro trader friend who never sleeps and is always in the market, he reads the news, analyzes it, watches community reactions, tracks whale wallets and fund movements.”',
    },
    {
        outlet: 'Bitcoin',
        logo: '/images/cdn/694cd0ae7a6a74881bc488d2_bitcoin.svg',
        quote: '“The flagship tool analyzes news events, historical data, fundamental and technical indicators, and community sentiment, including whale wallet activity, to generate highly accurate trading signals. These signals are tailored to each trader’s style by unique AI agents.”',
    },
    {
        outlet: 'Crypto Daily',
        logo: '/images/cdn/694ccfb331a3d9a7d5c9026a_crypto.svg',
        quote: '“The project has multiple flagship solutions that aim to fulfill Tradel’s mission to make the blockchain industry simpler and more intuitive for everyone.”',
    },
    {
        outlet: 'CoinMarketCap',
        logo: '/images/cdn/68aed53d749725e2986a0f39_6674528843624d79de5206dc_logo-coinmarketcap.svg',
        quote: "“Tradel's AI agents process market information substantially faster than human traders. During the February 2025 market downturn following Donald Trump's import tariff announcements, Tradel's AI agents detected price movements immediately and sent notifications to users.”",
    },
    {
        outlet: 'TradingView',
        logo: '/images/cdn/68aed53d749725e2986a0f3f_6674528ead6df03d07e332c9_logo-trading-view.svg',
        quote: '"Artificial intelligence models are poised to be an unprecedented improvement to trader performance which has long struggled with unprofitable strategies and approaches."',
    },
    {
        outlet: 'TechBullion',
        logo: '/images/cdn/694cd17eb85d6f31795f267a_TechBullion.svg',
        quote: '“At first, we didn’t have a strategy to quickly reach a million users,” explains Anthony Cerullo, Chief Business Development Officer at Tradel. “Our main goal was to launch the AI-agent technology, show how it works, explain it to the audience, and gather feedback to improve it.”',
    },
];

export type FooterLink = {
    label: string;
    current?: boolean;
    external?: boolean;
};

export const FOOTER_LINK_COLUMNS: FooterLink[][] = [
    [
        { label: 'Home', current: true },
        { label: 'trade' },
        { label: 'AI' },
        { label: 'Blog' },
        { label: 'Academy' },
        { label: 'Earn' },
        { label: 'TL Agents' },
        { label: 'Algotrading' },
        { label: 'Trading Strategies' },
        { label: 'AI Trading Agents - Not Bots.' },
        { label: 'Copy Trading' },
    ],
    [
        { label: 'Coins' },
        { label: 'Mobile application' },
        { label: 'Become a Partner', external: true },
        { label: 'Terms Of Use' },
        { label: 'Privacy Policy' },
    ],
];

export type Review = {
    name: string;
    date: string;
    text: string;
};

export const REVIEWS: Review[] = [
    {
        name: 'Kanav Sharma',
        date: 'June 16, 2025',
        text: 'I booked loss in indian share market. But on this side i book only profit with some little loss.',
    },
    {
        name: 'Leandro Cearense Da Silva',
        date: 'June 15, 2025',
        text: 'Sensational platform, very cool graphics with a unique appearance, easy to understand and investment indications in real time. With leverage points of your choosing. I’m really enjoying it!',
    },
    {
        name: 'Ravneet Kaur Bhatia',
        date: 'June 7, 2025',
        text: 'Good AI Trading Assistant App. It’s features are very simple and easy. This app has a very simple interface that is easy to use for beginners.',
    },
    {
        name: 'Harsh Gupta',
        date: 'June 1, 2025',
        text: 'User-friendly and efficient, Tradel’s AI features save me a lot of time. Highly recommended for both beginners and experienced traders.',
    },
    {
        name: 'Sameer Qurshe',
        date: 'June 1, 2025',
        text: 'The app is easy to use and the AI’s predictions are highly reliable. Tradel has significantly improved my trading results.',
    },
    {
        name: 'Jean Messias de Oliveira',
        date: 'April 20, 2025',
        text: 'Very good, I’m doing some tests, it has everything it needs to be a powerhouse, congratulations to the creators!',
    },
    {
        name: 'Erkan Er',
        date: 'March 25, 2025',
        text: 'It is a great application. It is better and more profitable to do two-way trading and it would be better if we can withdraw money to the bank account in TL.',
    },
    {
        name: 'Sonal Ydv',
        date: 'March 24, 2025',
        text: 'I appreciate how Tradel Ai constantly evolves to incorporate the latest advancements in AI technology. It’s reassuring to know that I’m always one step ahead of the competition.',
    },
    {
        name: 'md yousuf ali',
        date: 'March 18, 2025',
        text: 'This is one of the best crypto application . User friendly interface helps to manage your trading easy. Very nice definitely try it. 💯',
    },
    {
        name: 'Silva',
        date: 'March 8, 2025',
        text: 'I installed it on 03/05/204, deposited via Pix. Today 03/08/2024 is the third day of testing. 77% results in operations using the signals that the application generates. Withdrawal I haven’t tested it yet, but I saw that there is an option for Metamask and USDT TRC20, I will probably use TRC20. They could check the possibility of reducing withdrawal fees and leaving only the commission for the success of the operation charged.',
    },
];

export const ACADEMY_POSTS: BlogPost[] = [
    {
        title: 'Lesson 10.8: Stopping the Bleeding: Eliminating Revenge Trading',
        image: '/images/cdn/Revenge_Trading_Small.jpg',
        date: 'April 28, 2026',
    },
    {
        title: 'Lesson 10.7: The Cost of Emotion: Fear, Greed, and FOMO',
        image: '/images/cdn/tradel_academy_10.7_small.jpg',
        date: 'April 21, 2026',
    },
    {
        title: 'Lesson 10.6: Leverage & The Sword',
        image: '/images/cdn/TRADEL_ACADEMY_SMALL.jpg',
        date: 'April 14, 2026',
    },
];
