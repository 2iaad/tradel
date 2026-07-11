// ponytail: demo trade log straight from the design — swap for the trades
// API (GET /accounts/:accountId/trades) when the frontend wires it up.

export interface TradeLogRow {
    id: number;
    ts: number; // recency ordinal (higher = newer)
    sym: string;
    side: "LONG" | "SHORT";
    setup: string;
    entry: string;
    exit: string;
    size: string;
    rv: number;
    pnlv: number;
    date: string;
    time: string;
    noteTitle: string;
    noteBody: string;
    tags: [string, string];
}

export const TRADE_LOG: TradeLogRow[] = [
    { id: 1, ts: 20, sym: "NVDA", side: "LONG", setup: "breakout", entry: "128.40", exit: "134.92", size: "120", rv: 2.1, pnlv: 782.4, date: "JUL 01", time: "JUL 01 · 09:41", noteTitle: "Forced the NVDA entry", noteBody: "Went in before the retest confirmed. It worked, but it was luck — flag this pattern and wait for the candle close next time.", tags: ["discipline", "momentum"] },
    { id: 2, ts: 19, sym: "TSLA", side: "SHORT", setup: "failed breakout", entry: "243.10", exit: "236.55", size: "80", rv: 1.6, pnlv: 524.0, date: "JUL 01", time: "JUL 01 · 10:22", noteTitle: "A+ setup on TSLA short", noteBody: "Waited the full 15 minutes for the failed breakout. Textbook execution, size was right.", tags: ["setup", "short"] },
    { id: 3, ts: 18, sym: "AAPL", side: "LONG", setup: "trend pullback", entry: "231.20", exit: "229.84", size: "150", rv: -0.7, pnlv: -204.0, date: "JUN 30", time: "JUN 30 · 11:05", noteTitle: "Pullback never held", noteBody: "Bought the 9EMA touch but breadth was rolling over. Respected the stop — good exit, wrong context.", tags: ["risk", "context"] },
    { id: 4, ts: 17, sym: "AMD", side: "LONG", setup: "vwap reclaim", entry: "182.66", exit: "189.10", size: "100", rv: 1.9, pnlv: 644.0, date: "JUN 30", time: "JUN 30 · 13:48", noteTitle: "Patience paid on AMD", noteBody: "Third test of VWAP held with rising volume. Added on confirmation instead of anticipating — keep doing this.", tags: ["setup", "vwap"] },
    { id: 5, ts: 16, sym: "SPY", side: "SHORT", setup: "gap fill", entry: "618.32", exit: "620.10", size: "40", rv: -0.5, pnlv: -71.2, date: "JUN 27", time: "JUN 27 · 09:33", noteTitle: "Chased the open without a level", noteBody: "Jumped the gap fill with no plan. Cut it fast — small loss, clean exit. The note is the win.", tags: ["fomo", "gap-fill"] },
    { id: 6, ts: 15, sym: "BTC", side: "LONG", setup: "range break", entry: "108,420", exit: "112,884", size: "0.5", rv: 2.4, pnlv: 2232.0, date: "JUN 27", time: "JUN 27 · 15:12", noteTitle: "Weekend range resolved up", noteBody: "Four days of compression above 108k. Entered on the break with a tight invalidation below the range low.", tags: ["crypto", "range"] },
    { id: 7, ts: 14, sym: "META", side: "LONG", setup: "earnings drift", entry: "742.15", exit: "751.40", size: "30", rv: 1.1, pnlv: 277.5, date: "JUN 26", time: "JUN 26 · 10:02", noteTitle: "Post-earnings drift held", noteBody: "Small size on the continuation. Nothing fancy — took the base hit and moved on.", tags: ["earnings", "drift"] },
    { id: 8, ts: 13, sym: "QQQ", side: "SHORT", setup: "range fade", entry: "554.80", exit: "558.65", size: "60", rv: -0.9, pnlv: -231.0, date: "JUN 26", time: "JUN 26 · 14:31", noteTitle: "Faded strength into FOMC drift", noteBody: "Shorted into a trend day. The market told me twice and I argued. Rule: no fades on trend days.", tags: ["discipline", "trend-day"] },
    { id: 9, ts: 12, sym: "MSFT", side: "LONG", setup: "earnings drift", entry: "498.20", exit: "504.75", size: "45", rv: 1.3, pnlv: 294.75, date: "JUN 25", time: "JUN 25 · 10:15", noteTitle: "Clean drift continuation", noteBody: "Same playbook as META. Entry above the first pullback high, trailed under structure.", tags: ["earnings", "drift"] },
    { id: 10, ts: 11, sym: "COIN", side: "SHORT", setup: "failed breakout", entry: "342.60", exit: "335.10", size: "50", rv: 1.8, pnlv: 375.0, date: "JUN 24", time: "JUN 24 · 11:40", noteTitle: "Breakout sellers showed up fast", noteBody: "Failure at the prior high with a bearish engulf. Entered on the retest of the trigger.", tags: ["short", "setup"] },
    { id: 11, ts: 10, sym: "AMZN", side: "LONG", setup: "trend pullback", entry: "228.40", exit: "226.95", size: "90", rv: -0.6, pnlv: -130.5, date: "JUN 24", time: "", noteTitle: "", noteBody: "", tags: ["", ""] },
    { id: 12, ts: 9, sym: "TSLA", side: "LONG", setup: "orb", entry: "236.20", exit: "244.80", size: "60", rv: 2.2, pnlv: 516.0, date: "JUN 23", time: "JUN 23 · 09:52", noteTitle: "Opening range break, no hesitation", noteBody: "Planned the level pre-market, alert fired, executed. This is what prepared feels like.", tags: ["orb", "execution"] },
    { id: 13, ts: 8, sym: "SPY", side: "LONG", setup: "trend pullback", entry: "612.45", exit: "615.20", size: "80", rv: 1.0, pnlv: 220.0, date: "JUN 20", time: "JUN 20 · 13:20", noteTitle: "Boring base hit", noteBody: "Nothing to learn here and that is the point. Routine setup, routine size, routine exit.", tags: ["routine", "trend"] },
    { id: 14, ts: 7, sym: "ETH", side: "SHORT", setup: "range fade", entry: "3,842", exit: "3,761", size: "2.0", rv: 1.4, pnlv: 162.0, date: "JUN 19", time: "JUN 19 · 16:05", noteTitle: "Faded the deviation", noteBody: "Swept the range high and reclaimed. Short against the sweep, covered at mid-range.", tags: ["crypto", "range"] },
    { id: 15, ts: 6, sym: "NVDA", side: "LONG", setup: "breakout", entry: "121.80", exit: "120.66", size: "140", rv: -0.8, pnlv: -159.6, date: "JUN 18", time: "JUN 18 · 10:33", noteTitle: "Breakout into resistance", noteBody: "Level above was obvious in hindsight — daily supply from May. Zoom out before entering.", tags: ["review", "levels"] },
    { id: 16, ts: 5, sym: "GOOG", side: "LONG", setup: "vwap reclaim", entry: "201.35", exit: "205.88", size: "70", rv: 1.5, pnlv: 317.1, date: "JUN 17", time: "JUN 17 · 12:10", noteTitle: "Reclaim with sector tailwind", noteBody: "Whole sector was green. Took the reclaim, sized normal, trailed on the 15m.", tags: ["vwap", "sector"] },
    { id: 17, ts: 4, sym: "AMD", side: "SHORT", setup: "range fade", entry: "176.90", exit: "179.42", size: "110", rv: -1.0, pnlv: -277.2, date: "JUN 16", time: "JUN 16 · 14:55", noteTitle: "Full stop-out, clean process", noteBody: "Thesis invalidated at the range high reclaim. Took the full R loss without moving the stop. Process over outcome.", tags: ["risk", "process"] },
    { id: 18, ts: 3, sym: "QQQ", side: "LONG", setup: "orb", entry: "547.30", exit: "551.95", size: "55", rv: 1.2, pnlv: 255.75, date: "JUN 13", time: "", noteTitle: "", noteBody: "", tags: ["", ""] },
    { id: 19, ts: 2, sym: "HOOD", side: "LONG", setup: "breakout", entry: "41.20", exit: "44.05", size: "300", rv: 2.6, pnlv: 855.0, date: "JUN 12", time: "JUN 12 · 09:47", noteTitle: "Best trade of the month", noteBody: "Multi-week base, volume expansion on the break, held the runner into the close. Everything aligned.", tags: ["breakout", "runner"] },
    { id: 20, ts: 1, sym: "MSTR", side: "SHORT", setup: "gap fill", entry: "428.00", exit: "436.20", size: "25", rv: -1.1, pnlv: -205.0, date: "JUN 12", time: "JUN 12 · 11:28", noteTitle: "Fighting a squeeze", noteBody: "Shorted a high-beta name on a BTC up day. Correlation was screaming at me and I ignored it.", tags: ["correlation", "review"] },
];
