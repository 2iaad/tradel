// Shared Carbon Terminal class strings (auth page + dashboard modal).
// Palette: the global `primary` token is the single UI accent.
// Green/red are reserved for win/loss (P&L) signals only — see G/R below.
export const inputCls =
    'w-full box-border bg-muted border border-border rounded-lg px-3.5 py-[13px] text-content text-sm outline-none transition-[border-color,box-shadow] duration-200 focus:border-primary focus:ring-3 focus:ring-primary/15';
export const labelCls =
    'block font-mono text-[10.5px] font-medium tracking-[0.14em] uppercase text-content-faint mb-[7px]';
export const btnCls =
    'w-full border-none rounded-lg p-3.5 mt-1 bg-primary text-primary-foreground font-semibold text-[14.5px] cursor-pointer transition-[background,transform] hover:bg-primary-hover active:scale-[0.985] disabled:opacity-60 disabled:cursor-default';
export const linkCls =
    'bg-transparent border-none p-0 text-primary font-medium cursor-pointer hover:text-primary-hover';
export const kickerCls = 'font-mono text-[11px] font-medium tracking-[0.2em] text-primary';
export const errorCls = 'm-0 text-[13px] text-loss';

// Dashboard building blocks.
// Win/loss signal colors — P&L only, never UI chrome.
// Canvas APIs cannot resolve CSS custom properties, so these mirror the
// semantic tokens in globals.css for Chart.js and the auth canvas.
export const canvasColors = {
    profit: '#2fd57f',
    loss: '#f0554e',
    faint: '#5f6b70',
    borderFaint: '#161c20',
    card: '#0e1214',
} as const;
export const G = canvasColors.profit;
export const R = canvasColors.loss;
export const monoFontStack =
    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";
export const cardCls = 'bg-card border border-border-subtle rounded-[10px]';
export const h2Cls = 'm-0 text-[17px] font-semibold text-card-foreground';
export const ctaCls =
    'border-none rounded-lg px-[18px] py-[11px] bg-primary text-primary-foreground font-semibold text-[13.5px] cursor-pointer transition-[background,transform] hover:bg-primary-hover active:scale-[0.97]';
export const ghostBtnCls =
    'bg-transparent border-none p-0 font-mono text-[11px] font-medium tracking-[0.1em] text-primary cursor-pointer hover:text-primary-hover';
