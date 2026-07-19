---
name: perf-hunt
description: Find and fix scroll/UI jank in this portfolio (Next.js + Lenis + motion + gsap + react-scan). Use when the user reports lag, freezing, stutter, or slowness while scrolling or interacting, or asks to profile/optimize performance. Covers the full loop:trace with real Chrome (chrome-devtools-mcp) or headless Puppeteer fallback, cross-reference react-scan render logs against the trace, diagnose, fix, and verify.
---

# Perf Hunt

Full loop for chasing scroll/UI jank in this repo, end to end: capture → diagnose →
fix → verify. Written from the session that fixed ProjectsV3 scroll lag and found
three unnecessary-re-render sources via react-scan + a Chrome performance trace.

## 0. Prerequisites — check these first, don't assume

- **react-scan wiring**: `src/components/ReactScan.jsx` mounted as first child of
  `<html>` in `src/app/layout.jsx`. If missing, re-add it (see "react-scan setup"
  below) — it's dev-only (`enabled: process.env.NODE_ENV === 'development'`), safe
  to leave wired permanently.
- **Chrome availability for chrome-devtools-mcp**: try `mcp__chrome-devtools__new_page`
  first. On this machine it has failed with "Could not find Google Chrome executable
  for channel 'stable' at /opt/google/chrome/chrome" — no Chrome/Chromium installed.
  If that happens, don't fight it — fall back to the Puppeteer script in step 2
  (bundled Chromium, no system install needed). If chrome-devtools-mcp works, prefer
  it: real browser, live console access, built-in trace insights via
  `performance_analyze_insight`.
- **Dev server running**: `npm run dev` in background (`run_in_background: true`),
  poll with `until curl -s -o /dev/null --max-time 2 http://localhost:3000; do sleep 0.5; done`
  — don't sleep-loop blindly, don't assume it's already up.

## 1. Reproduce first — don't optimize blind

Ask exactly where the lag is felt if the user doesn't say (which section, which
scroll direction, does it get worse over time). Cross-reference: `git log --oneline`
and `git diff` to see what changed recently — jank that appeared after a specific
commit narrows the search fast. Don't start profiling the whole page if the user
already named a component.

## 2. Capture a trace

### Path A — chrome-devtools-mcp (real Chrome, use if available)

```
mcp__chrome-devtools__new_page          url: http://localhost:3000
mcp__chrome-devtools__performance_start_trace   reload: true, autoStop: false
# drive the interaction: scroll, hover, click — whatever reproduces the lag
mcp__chrome-devtools__performance_stop_trace
mcp__chrome-devtools__list_console_messages     (react-scan logs land here)
```

Then `performance_analyze_insight` on whatever insight sets the stop_trace result
flags (e.g. `LayoutShift`, `LCPBreakdown`, long-task-related insights).

### Path B — Puppeteer fallback (bundled Chromium, no system Chrome needed)

Used successfully this session. Write a script to the scratchpad dir (never to the
repo) that:

1. Launches puppeteer headless, sets viewport (e.g. 1440×900).
2. Attaches a `console` listener that buffers `{t: Date.now(), type, text}` for
   every message — this is where react-scan's `log: true` output goes.
3. `page.goto(url, { waitUntil: 'networkidle2' })`, then wait ~3s for hydration +
   react-scan init.
4. `performance.mark('scroll-start')`, then drive the interaction — for scroll
   jank, simulate real wheel input via repeated `page.mouse.wheel({ deltaY })`
   calls with small sleeps between them (NOT `window.scrollTo`, which bypasses
   Lenis/smooth-scroll and won't reproduce the same jank). Size `deltaY` and step
   count so the loop covers the full page height over ~10-15s ("slowly", matching
   what the user actually does).
5. `performance.mark('scroll-end')`, stop tracing.
6. Parse the saved trace JSON yourself (`page.tracing.start({ path, categories })`
   writes a devtools-timeline-compatible trace) — filter `traceEvents` to the
   `[scroll-start, scroll-end]` window, then:
   - `RunTask` events with `dur > 50000` (50ms) = long tasks (janky frames)
   - nest `FunctionCall`/`Layout`/`Paint`/etc. children inside each long task by
     `ts` range to see what composed it
   - `Layout` events carrying `args.beginData.stackTrace` = **forced synchronous
     reflows** — group by top stack frame (function@file:line) to find the
     read-after-write culprit
   - sum durations per event name across the whole window for a totals table
   - bucket task duration per wall-clock second to localize *where* in the
     scroll the lag concentrates (this is how "laggier at the 4th project" got
     confirmed as the video card, not a general slowdown)

This script is reusable — save it once in the scratchpad, rerun after each fix
round to get a before/after diff. Categories needed for `tracing.start`:
`devtools.timeline`, `disabled-by-default-devtools.timeline`,
`disabled-by-default-devtools.timeline.frame`,
`disabled-by-default-devtools.timeline.stack`, `blink.user_timing`, `toplevel`,
`v8.execute`.

## 3. Cross-reference react-scan against the trace

react-scan's `log: true` dumps one console group per render, tagged with the
component's display name (`%cComponentName`). Pull the buffered console messages
from the same `[scroll-start, scroll-end]` window and tally render counts per
component name (regex `/%c([A-Za-z.]+)/` on the message text).

**The diagnostic move**: a component that renders dozens of times during a scroll
that shouldn't touch it at all is a re-render bug, not inherent work. Match it
against the trace:
- High render count + shows up as `FunctionCall` inside a long task → confirmed,
  its re-render is costing real frame time.
- High render count of something wrapping many DOM nodes (SVG icons, mapped
  lists, split-per-character text) → check what's forcing the reflow
  (`measure@framer-motion`, `calcTextDimensions@react-activity-calendar`, etc. —
  the forced-reflow stack grouping from step 2 tells you which library is doing
  expensive layout reads on components that didn't need to move at all).

Then find *why* it re-rendered: walk up the component tree from the flagged
component to find what state lives above it. The recurring pattern in this repo:
a scroll-driven or interval `useState` at a parent (scroll-spy active section,
hover state, a GSAP-triggered heading swap, a live clock tick) re-renders the
*entire subtree* under it, including static siblings that never needed to change.

## 4. Fix patterns (cheapest first)

In order of how often each was the actual fix this session:

1. **`memo()` the static subtree** that's getting dragged along by a parent's
   scroll/hover/interval state. This was the fix for: a marquee of 20+ logos
   re-rendering on every scroll-triggered heading swap, 5 animated nav words
   (each exploded into per-letter `motion.span`) re-rendering on every
   scroll-spy tick, and a 365-cell GitHub contribution calendar re-rendering
   fully on every single cell hover. Pull the static part into its own component,
   wrap in `memo`, pass only the stable setter/callback down as a prop.
2. **Kill `drop-shadow`/expensive CSS filters on elements that repaint every
   frame.** A filter forces the browser to re-rasterize the whole element on
   every property change — brutal on an SVG path whose `stroke-dashoffset`
   changes every scroll tick. Drop the filter, keep glow effects on small
   elements that don't repaint continuously (a comet dot, a node dot) instead.
3. **Move per-frame position updates to `transform`, never `left`/`top`.**
   `transform` is compositor-only; `left`/`top` triggers layout+paint every frame.
4. **Never call layout-reading APIs (`getBoundingClientRect`,
   `getPointAtLength`, `getComputedStyle`) inside a scroll/rAF handler on every
   frame.** Pre-sample once (e.g. build a lookup table with N samples along an
   SVG path) and interpolate at read time instead.
5. **Early-exit scroll/resize handlers when the derived value hasn't
   meaningfully changed** — most scroll events outside the region of interest
   should do zero DOM writes.
6. **Debounce `ResizeObserver` callbacks that trigger expensive re-measurement**
   if the thing being observed also animates its own size (e.g. a hover
   transition that grows a row's height) — the observer fires on every
   animation frame otherwise.
7. **Gate expensive media (autoplay video) on both viewport visibility AND
   whatever "active/lit" state controls its opacity** — a dimmed, grayscaled,
   off-focus video still decodes and repaints every frame if left playing.

## 5. Verify

Re-run the exact same trace script from step 2 and diff against the baseline:
worst long-task duration, total `FunctionCall`/`Layout`/`Paint` time across the
window, forced-reflow count, and react-scan render tally per component. Report
concrete deltas (ms before/after), not just "should be faster." Then tell the
user to scroll it themselves — a synthetic headless trace with react-scan running
adds its own overhead (react-scan's own instrumentation causes forced reflows too
— expect ~20-30 in the "before" and "after" both, don't chase those away), so the
real browser feel is the actual judge, not the trace number alone.

## react-scan setup (if not already wired)

```jsx
// src/components/ReactScan.jsx
'use client';
import { useEffect } from 'react';
import { scan } from 'react-scan';

export function ReactScan() {
  useEffect(() => {
    scan({
      enabled: process.env.NODE_ENV === 'development',
      log: true,
      trackUnnecessaryRenders: true,
    });
  }, []);
  return null;
}
```

Mount as literally the first child of `<html>` in `src/app/layout.jsx` (before
`<body>`) — react-scan must attach before the tree it profiles. Root layout stays
a server component; don't add `'use client'` to layout.jsx itself, it breaks the
`metadata` export. `npm i -D react-scan`.

## Cleanup

Puppeteer + scratchpad trace script are throwaway — never write them into the
repo. Kill the dev server (`ss -tlnp | grep :3000` → `kill <pid>`) when the user
is done testing, don't leave it orphaned across sessions.