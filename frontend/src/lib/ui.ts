// Shared Carbon Terminal class strings (auth page + dashboard modal).
// Palette: yellow #ffdd3a is the single UI accent (matches the landing page).
// Green/red are reserved for win/loss (P&L) signals only — see G/R below.
export const inputCls =
    'w-full box-border bg-[#0a0d0f] border border-[#222a2f] rounded-lg px-3.5 py-[13px] text-[#e9eef0] text-sm outline-none transition-[border-color,box-shadow] duration-200 focus:border-[#ffdd3a] focus:shadow-[0_0_0_3px_rgba(255,221,58,0.13)]';
export const labelCls =
    'block font-mono text-[10.5px] font-medium tracking-[0.14em] uppercase text-[#5f6b70] mb-[7px]';
export const btnCls =
    'w-full border-none rounded-lg p-3.5 mt-1 bg-[#ffdd3a] text-[#231a00] font-semibold text-[14.5px] cursor-pointer transition-[background,transform] hover:bg-[#ffe867] active:scale-[0.985] disabled:opacity-60 disabled:cursor-default';
export const linkCls =
    'bg-transparent border-none p-0 text-[#ffdd3a] font-medium cursor-pointer hover:text-[#ffe867]';
export const kickerCls = 'font-mono text-[11px] font-medium tracking-[0.2em] text-[#ffdd3a]';
export const errorCls = 'm-0 text-[13px] text-[#f0554e]';

// Dashboard building blocks.
// UI accent (yellow) — chart lines, highlights, non-P&L emphasis.
export const A = '#ffdd3a';
// Win/loss signal colors — P&L only, never UI chrome.
export const G = '#2fd57f';
export const R = '#f0554e';
export const cardCls = 'bg-[#0e1214] border border-[#1b2226] rounded-[10px]';
export const h2Cls = 'm-0 text-[17px] font-semibold text-[#eef4f2]';
export const ctaCls =
    'border-none rounded-lg px-[18px] py-[11px] bg-[#ffdd3a] text-[#231a00] font-semibold text-[13.5px] cursor-pointer transition-[background,transform] hover:bg-[#ffe867] active:scale-[0.97]';
export const ghostBtnCls =
    'bg-transparent border-none p-0 font-mono text-[11px] font-medium tracking-[0.1em] text-[#ffdd3a] cursor-pointer hover:text-[#ffe867]';
