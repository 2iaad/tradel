// Shared application class strings (auth page + dashboard modal).
// UI chrome uses black/yellow/gray; green/red are semantic-only signals.
export const inputCls =
    'w-full h-10 min-h-10 box-border bg-muted border border-border rounded-lg px-3.5 py-3 text-content text-sm outline-none transition-[border-color,box-shadow] duration-200 focus:border-primary focus:ring-3 focus:ring-primary/15';
export const labelCls =
    'block font-mono text-ui-xs font-medium tracking-[0.14em] uppercase text-content-faint mb-[7px]';
export const btnCls =
    'w-full h-10 min-h-10 border-none rounded-lg p-0 mt-1 bg-primary font-semibold text-ui-md text-black cursor-pointer transition-[background,transform] hover:bg-primary-hover active:scale-[0.985] disabled:opacity-60 disabled:cursor-default';
export const linkCls =
    'bg-transparent border-none p-0 text-primary font-medium cursor-pointer hover:text-primary-hover';
export const kickerCls = 'font-mono text-ui-xs font-medium tracking-[0.2em] text-primary';
export const errorCls = 'm-0 text-ui-sm text-loss';

// Dashboard building blocks.
// Canvas APIs cannot resolve CSS custom properties, so these values mirror
// the canonical tokens in globals.css. Positive data uses green and negative
// data uses red; categorical series continue to use the brand palette.
export const canvasColors = {
    black: '#050505',
    surface: '#101010',
    surfaceHover: '#181818',
    yellow: '#ffdd3a',
    yellowHover: '#ffe66b',
    yellowMuted: '#b8a12c',
    yellowDark: '#3f3712',
    profit: '#2fd57f',
    profitDark: '#123424',
    loss: '#f0554e',
    lossDark: '#38191a',
    grayLight: '#d2d2cd',
    gray: '#858580',
    grayDim: '#6b6b66',
    grayDark: '#4d4d49',
    border: '#2b2b28',
    borderFaint: '#171716',
    faint: '#6b6b66',
    card: '#101010',
} as const;
export const G = canvasColors.profit;
export const R = canvasColors.loss;
export const monoFontStack =
    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";
export const cardCls = 'bg-card border border-border-subtle rounded-[10px]';
export const cardTitleCls =
    'm-0 font-heading text-ui-lg font-semibold leading-snug tracking-normal normal-case text-card-foreground';
export const cardDescriptionCls = 'mt-1 text-ui-sm font-medium text-content-faint';
export const cardMetaLabelCls =
    'font-mono text-ui-xs font-medium uppercase tracking-[0.14em] text-content-faint';
export const cardMetaValueCls = 'text-ui-sm font-semibold text-content';
export const cardFooterCls = 'border-t border-border-subtle bg-muted/35 px-[22px] py-3';
export const h2Cls = cardTitleCls;
export const ctaCls =
    'border-none rounded-lg px-[18px] py-[11px] bg-primary text-ui-md text-black cursor-pointer transition-[background,transform] hover:bg-primary-hover active:scale-[0.97]';
export const ghostBtnCls =
    'bg-transparent border-none p-0 font-mono text-ui-xs font-medium tracking-[0.1em] text-primary cursor-pointer hover:text-primary-hover';
