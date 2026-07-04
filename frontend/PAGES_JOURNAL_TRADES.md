# Journal & Trades — what should go on these pages

Both pages are empty right now (just a "coming soon" text). Here is what I
think should be on them, explained simply.

---

## 1. `/dashboard/trades` — "Trades"

Think of this page as your **full history book of every trade you made**.
The dashboard home page already shows a small preview ("Recent trades", only
a few rows). This page is the complete, searchable version of that table.

### What it should contain
- **A big table**, one row per trade: symbol, long/short, entry price, exit
  price, size, R (risk multiple), profit or loss, date. Same columns as the
  small preview already on the dashboard, just the full list instead of 5
  rows.
- **Filters on top**: by date range, by symbol, by win/loss, by long/short.
  So you can answer "show me only my losing shorts in June".
- **A search box**: type a symbol name and jump to it.
- **Sorting**: click a column header (date, P&L, R) to sort by it.
- **A button to add a trade manually**, and later maybe "import from CSV"
  (brokers let you export your trade history as a file).
- **Click a row → opens the details** of that one trade (maybe a side panel
  or a new page): could show a chart of that trade, your notes about it,
  screenshots, etc. This part can come later, not urgent.
- **Small stats bar on top**: total trades, win rate, average R, total P&L —
  same numbers as the dashboard stat cards but filtered to what you're
  currently viewing (e.g. if you filter by "June", the stats update for June
  only).

### Page layout (ascii)

```
╔══════════════════════════════════════════════════════════════════════════╗
║  TRADEL                                          ●●● live · user@mail.com ║
╠════════════╦═════════════════════════════════════════════════════════════╣
║            ║  Trades                                                     ║
║  01 Dash   ║  ┌─────────────────────────────────────────────────────────┐║
║  02 Journal║  │ Total: 128   Win%: 61%   Avg R: 1.4   P&L: +$4,210      │║
║ ▶03 Trades ║  └─────────────────────────────────────────────────────────┘║
║  04 Analyt.║                                                             ║
║  05 Calend.║  ┌─[ Search symbol… ]──[ Date ▾ ]──[ Side ▾ ]──[+ Add ]────┐║
║  06 Settgs ║  └─────────────────────────────────────────────────────────┘║
║            ║                                                             ║
║            ║  ┌─────────────────────────────────────────────────────────┐║
║            ║  │ SYMBOL  SIDE   ENTRY   EXIT    SIZE   R    P&L    DATE  │║
║            ║  ├─────────────────────────────────────────────────────────┤║
║            ║  │ ●EURUSD [LONG]  1.0812 1.0850  0.5   +1.6  +190  Jul 02 │║
║            ║  │ ●BTCUSD [SHORT] 61200  60800   0.1   +0.9  +120  Jul 01 │║
║            ║  │ ●GBPUSD [LONG]  1.2650 1.2610  0.3   -1.1  -80   Jun 29 │║
║            ║  │ ●XAUUSD [SHORT] 2340   2325    0.2   +1.2  +95   Jun 27 │║
║            ║  │  ⋮        ⋮       ⋮      ⋮      ⋮     ⋮     ⋮      ⋮    │║
║            ║  └─────────────────────────────────────────────────────────┘║
║ ┌────────┐ ║  ┌───────────────────────────────────[ ‹ 1 2 3 … 9 › ]─────┐║
║ │(●) You │ ║  │                pagination / load more                  │║
║ └────────┘ ║  └─────────────────────────────────────────────────────────┘║
╚════════════╩═════════════════════════════════════════════════════════════╝
```

---

## 2. `/dashboard/journal` — "Journal"

Think of this as your **diary for trading**. Not just numbers — this is
where you write down *why* you took a trade, what you were feeling, what you
learned. The dashboard preview already has a small "Journal notes" card with
a few entries; this page is the full version.

### What it should contain
- **A feed/list of notes**, newest first. Each note: a title, a short body
  text, a date, and tags (like "mistake", "good-setup", "FOMO", "breakout").
  Same shape as what's already in the small preview card.
- **A big "+ New note" button** that opens a simple text editor: title,
  body, tags, and optionally "link this note to a trade" (so a note can be
  attached to a specific trade from the Trades page).
- **Filter by tag**: click a tag pill ("mistake") to see only notes with
  that tag. Helps you find patterns like "what mistakes do I keep repeating".
- **Search box** to search inside note titles/bodies.
- **Optional later**: a calendar view (one entry per trading day, so you can
  see which days you journaled and which you skipped) — this can reuse the
  existing `/dashboard/calendar` page pattern, not urgent for v1.

### Page layout (ascii)

```
╔══════════════════════════════════════════════════════════════════════════╗
║  TRADEL                                          ●●● live · user@mail.com ║
╠════════════╦═════════════════════════════════════════════════════════════╣
║            ║  Journal                                     ┌───────────┐  ║
║  01 Dash   ║                                               │ + NEW     │  ║
║ ▶02 Journal║                                               └───────────┘  ║
║  03 Trades ║  ┌─[ Search notes… ]──[ #mistake ][ #good-setup ][ #FOMO ]─┐║
║  04 Analyt.║  └─────────────────────────────────────────────────────────┘║
║  05 Calend.║                                                             ║
║  06 Settgs ║  ┌─────────────────────────────────────────────────────────┐║
║            ║  │ ◆ Chased a breakout too late                            │║
║            ║  │   Entered after the candle already closed 2% up.        │║
║            ║  │   Jul 02   [mistake] [FOMO]                             │║
║            ║  ├─────────────────────────────────────────────────────────┤║
║            ║  │ ◆ Good discipline on GBPUSD short                       │║
║            ║  │   Waited for confirmation, sized correctly, took profit │║
║            ║  │   at target instead of getting greedy.                  │║
║            ║  │   Jun 29   [good-setup] [discipline]                    │║
║            ║  ├─────────────────────────────────────────────────────────┤║
║            ║  │ ◆ Revenge trade after the loss                          │║
║            ║  │   Doubled size right after a red trade. Bad idea.       │║
║            ║  │   Jun 27   [mistake] [oversized]                        │║
║            ║  ├─────────────────────────────────────────────────────────┤║
║            ║  │  ⋮                                                      │║
║            ║  └─────────────────────────────────────────────────────────┘║
║ ┌────────┐ ║                                                             ║
║ │(●) You │ ║                                                             ║
║ └────────┘ ║                                                             ║
╚════════════╩═════════════════════════════════════════════════════════════╝
```

---

## Quick summary

| Page    | Purpose                        | Core building block                     |
|---------|---------------------------------|------------------------------------------|
| Trades  | Full history of every trade     | Big filterable/sortable table            |
| Journal | Your written thoughts & lessons | Full list of tagged, searchable notes    |

Both reuse pieces you already built: `TradesTable` and `NotesList` are the
"preview" versions on the dashboard home — these two pages are just the
"full, filterable" versions of the same components.
