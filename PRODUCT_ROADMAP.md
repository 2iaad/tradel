# Tradel Product and Engineering Roadmap

## Purpose

Tradel is both a trading-journal product and a software-engineering portfolio project. This roadmap first closes the gaps in the current implementation, then adds features that demonstrate product thinking, backend architecture, data engineering, real-time systems, analytics, security, testing, and responsible AI.

The proposed direction reflects features offered by current platforms such as [TradeZella](https://www.tradezella.com/features), [TraderSync](https://tradersync.com/features/), and [Edgewonk](https://edgewonk.com/features): automated imports, advanced analytics, calendar reports, risk tracking, trade replay, psychology analysis, screenshots, simulations, and AI-assisted insights.

## Recommended order

1. Complete and harden the existing product.
2. Make trade capture fast and trustworthy.
3. Build analytics and review workflows.
4. Add external market context and real-time behavior.
5. Finish with differentiated intelligence and collaboration features.

---

## Phase 1 — Complete the existing product

### 1. Complete account management and multi-account navigation

**Description:**  
Finish the account experience so users can create, select, rename, and delete multiple broker or prop-firm accounts. Every dashboard, trade, note, and statistic should respect the selected account instead of silently using the first account or lazily creating a default account.

**Technical description:**  
Connect the existing account CRUD API to a Zustand account store and persistent account selector. Scope trade requests and dashboard queries by the selected UUID. Add deletion confirmation, empty states, API error handling, and tests for ownership isolation and account switching.

**Technologies needed:**  
Next.js, React, Zustand, Axios, NestJS, PostgreSQL, Jest, Playwright.

**How the technologies work together:**  
NestJS and PostgreSQL enforce account ownership, Axios retrieves account-scoped data, Zustand holds the active account, and Next.js renders it across the dashboard. Jest verifies service rules while Playwright tests the complete switching and CRUD experience.

**Steps:**

1. Create the account store, selector, and account-management interface.
2. Replace first-account assumptions with an explicit active account.
3. Handle creation, editing, deletion, loading, and empty states.
4. Add backend ownership and frontend end-to-end tests.

### 2. Integrate notes and the journal interface

**Description:**  
The notes API exists, but the frontend still displays placeholder content. Build a useful journal where users can write trade reviews, tag lessons and mistakes, edit entries, and browse notes by account, trade, tag, or date.

**Technical description:**  
Add a typed notes store and connect it to the existing nested REST endpoints. Build note forms, detail views, filters, and trade-linked panels. Extend the API only where pagination or combined trade metadata is needed, while preserving account ownership checks.

**Technologies needed:**  
Next.js, React, Zustand, Axios, NestJS, PostgreSQL, PostgreSQL arrays, Playwright.

**How the technologies work together:**  
React provides the editor and filters, Zustand coordinates note state, Axios calls the NestJS controllers, and PostgreSQL stores searchable trade relationships and tags. Playwright verifies creation, editing, filtering, and authorization from the user’s perspective.

**Steps:**

1. Build typed note API methods and client state.
2. Implement create, read, update, and delete interfaces.
3. Connect notes to trade rows and the journal page.
4. Add filtering, empty states, and end-to-end coverage.

### 3. Finish calendar, analytics, and equity pages

**Description:**  
Replace remaining dashboard placeholders with real account data. Users should see daily profit and loss on a calendar, an equity curve, drawdowns, win rate, profit factor, expectancy, average R, and breakdowns by symbol, side, setup, and time.

**Technical description:**  
Create owner-scoped aggregate endpoints using SQL grouping and window functions. Add date, account, strategy, and tag filters. Render accessible charts and calendar cells from typed response DTOs, with consistent currency handling, time-zone rules, and empty states.

**Technologies needed:**  
PostgreSQL window functions, NestJS, OpenAPI/Swagger, Next.js, Canvas or a chart library, Jest.

**How the technologies work together:**  
PostgreSQL performs reliable aggregation, NestJS exposes stable report DTOs, and Next.js renders interactive charts and calendars. Swagger documents report contracts, while Jest tests financial calculations and edge cases independently of the visual layer.

**Steps:**

1. Define metric formulas, date boundaries, and report contracts.
2. Implement aggregate SQL queries and report endpoints.
3. Connect calendar, equity, and analytics interfaces.
4. Verify calculations with deterministic datasets and tests.

### 4. Harden authentication and session management

**Description:**  
Complete the authentication lifecycle with protected navigation, password reset, email verification, refresh-token rotation, session visibility, and reliable logout behavior. This turns the existing authentication foundation into a production-shaped system and creates strong interview material around security tradeoffs.

**Technical description:**  
Rotate refresh tokens atomically, detect token reuse, and store session metadata. Add password-reset and verification tokens with short expirations. Protect dashboard routes server-side or through middleware, rate-limit sensitive endpoints, and add security-focused integration tests.

**Technologies needed:**  
NestJS, PostgreSQL transactions, JWT, bcrypt, HTTP-only cookies, email provider, rate limiting, Jest, Supertest.

**How the technologies work together:**  
NestJS manages authentication workflows, PostgreSQL transactions rotate and revoke sessions safely, JWTs authorize API calls, and HTTP-only cookies protect refresh tokens. An email provider delivers expiring links, while Supertest verifies cookies, revocation, reuse detection, and access control.

**Steps:**

1. Implement rotating sessions, revocation, and reuse detection.
2. Add verification and password-reset workflows.
3. Protect frontend routes and improve expired-session handling.
4. Add rate limits and authentication integration tests.

### 5. Establish automated quality and delivery

**Description:**  
Add the missing engineering safety net: repeatable local environments, unit and integration tests, API end-to-end tests, frontend browser tests, continuous integration, structured logging, and deployment documentation. Recruiters can then evaluate not only features, but how confidently the project can evolve.

**Technical description:**  
Use test containers or a dedicated PostgreSQL test service, seed deterministic fixtures, and run lint, type-check, tests, migrations, and builds in CI. Add request IDs, structured logs, health endpoints, error monitoring, and multi-stage production containers.

**Technologies needed:**  
Jest, Supertest, Playwright, Docker Compose, GitHub Actions, PostgreSQL, Pino, OpenTelemetry or Sentry.

**How the technologies work together:**  
Docker provides reproducible databases, Jest and Supertest cover backend behavior, and Playwright validates user flows. GitHub Actions gates merges on every check. Structured logs and telemetry connect frontend failures, API requests, and database behavior in deployed environments.

**Steps:**

1. Repair dependency layout and create deterministic test environments.
2. Cover critical services, APIs, and browser journeys.
3. Add CI, health checks, logging, and error monitoring.
4. Containerize and document staging and production deployment.

---

## Phase 2 — Core competitive features

### 6. CSV broker import with background processing

**Description:**  
Allow users to import broker statements instead of manually entering every trade. Begin with a documented CSV template and two popular broker formats, then provide column mapping, validation previews, duplicate detection, and an import history showing accepted and rejected rows.

**Technical description:**  
Upload files to object storage, create an import job, and parse rows in a worker. Normalize executions into trades inside database transactions using idempotency fingerprints. Stream job progress to the client and produce downloadable row-level error reports.

**Technologies needed:**  
NestJS, BullMQ, Redis, PostgreSQL, S3-compatible storage, CSV parser, Server-Sent Events, Next.js.

**How the technologies work together:**  
NestJS accepts uploads and queues jobs, object storage retains source files, BullMQ and Redis process imports asynchronously, and PostgreSQL stores normalized trades idempotently. Server-Sent Events update the Next.js progress interface without repeated polling.

**Steps:**

1. Define the canonical execution model and import adapters.
2. Build upload, preview, mapping, and validation.
3. Process imports asynchronously with deduplication.
4. Add progress, history, failure reports, and load tests.

### 7. Advanced trade model and risk management

**Description:**  
Track what serious traders need beyond one entry and exit: multiple executions, fees, commissions, stop loss, targets, planned risk, strategy, setup, mistakes, and screenshots. Calculate weighted prices, realized profit, risk-to-reward, R-multiple, and rule compliance automatically.

**Technical description:**  
Normalize trades into positions and executions, add strategies and typed tags, and calculate financial fields server-side with decimal-safe arithmetic. Store attachments in object storage and derive immutable summaries from executions to prevent inconsistent client calculations.

**Technologies needed:**  
PostgreSQL, NestJS, decimal arithmetic library, S3-compatible storage, Next.js, image optimization.

**How the technologies work together:**  
PostgreSQL models positions, fills, strategies, and tags; NestJS validates commands and calculates trusted totals using decimal arithmetic. Object storage holds screenshots, while Next.js presents an expandable trade workspace with execution and risk details.

**Steps:**

1. Design and migrate the position, execution, strategy, and tag schema.
2. Implement server-side calculations and validation.
3. Build execution, risk, screenshot, and tagging interfaces.
4. Migrate existing trades and add calculation tests.

### 8. Review routines, playbooks, and rule checklists

**Description:**  
Turn stored data into deliberate practice. Users define playbooks and pre-trade rules, score execution quality, record emotions, and complete daily, weekly, or monthly review templates. The system then separates strategy performance from discipline and execution performance.

**Technical description:**  
Model versioned playbooks, checklist responses, emotion scales, mistakes, review templates, and review periods. Snapshot the applicable rules onto each trade so later playbook edits do not rewrite history. Aggregate compliance and mistake cost alongside normal performance metrics.

**Technologies needed:**  
NestJS, PostgreSQL JSONB, scheduled jobs, Next.js forms, Zod or class-validator, charting.

**How the technologies work together:**  
PostgreSQL and JSONB store flexible but versioned review structures, NestJS validates templates and snapshots rules, scheduled jobs open periodic reviews, and Next.js guides completion. Analytics correlate checklist compliance, emotions, mistakes, and financial outcomes.

**Steps:**

1. Model playbooks, rules, reviews, emotions, and mistakes.
2. Build template editors and guided review workflows.
3. Snapshot trade rules and calculate compliance metrics.
4. Add reminders and psychology-performance reports.

### 9. Custom analytics dashboard and report builder

**Description:**  
Let traders answer their own questions by composing dashboard widgets and filtered reports. A user could compare a setup by weekday, session, symbol, market condition, or emotional state, save the view, and drill from an aggregate result into its underlying trades.

**Technical description:**  
Create a safe report specification rather than accepting raw SQL. Translate permitted dimensions, measures, filters, and groupings into parameterized queries. Cache expensive results, save widget layouts, and include drill-down identifiers plus exportable CSV or PDF output.

**Technologies needed:**  
NestJS, PostgreSQL, Redis, Next.js, drag-and-drop library, chart library, PDF generation.

**How the technologies work together:**  
Next.js builds a report specification and configurable layout, NestJS validates it against an allowlist, PostgreSQL performs aggregations, and Redis caches repeated reports. Charts visualize results, while PDF and CSV generators create portable review artifacts.

**Steps:**

1. Define allowed dimensions, metrics, filters, and formulas.
2. Build the query compiler, authorization, and caching.
3. Implement widgets, saved layouts, and drill-downs.
4. Add exports, performance budgets, and query tests.

---

## Phase 3 — Market context and real-time features

### 10. Live prices, watchlists, and trade chart overlays

**Description:**  
Display current or delayed prices for watched instruments and show historical candles around each trade. Entry, exit, stop, and target markers should appear directly on the chart, giving users visual context and an interview-ready example of real-time data delivery.

**Technical description:**  
Integrate one licensed market-data provider behind a provider interface. Cache quotes, respect exchange entitlements and rate limits, persist only permitted candles, and publish updates through WebSockets. Render candle charts with execution overlays and explicit delayed-data labels.

**Technologies needed:**  
Market-data API, NestJS WebSocket gateway, Redis, PostgreSQL or TimescaleDB, Lightweight Charts, Next.js.

**How the technologies work together:**  
The provider supplies quotes and candles, NestJS normalizes them, Redis caches fan-out data, and WebSockets push updates to Next.js. PostgreSQL or TimescaleDB retains permitted history, while Lightweight Charts overlays executions and risk levels.

**Steps:**

1. Select a provider after reviewing licensing and market coverage.
2. Build normalized quote and candle adapters with caching.
3. Add watchlists, WebSocket updates, and reconnect handling.
4. Render trade overlays and test rate-limit degradation.

### 11. News and economic-event context

**Description:**  
Show relevant company news, macroeconomic releases, earnings, and market events beside each trade. Users can see what information was available before entry and study whether trading near high-impact events improves or damages their results without turning Tradel into an execution platform.

**Technical description:**  
Ingest licensed news and calendar feeds into normalized event records. Match events by symbol, sector, currency, and time window, cache provider responses, and snapshot associations for reproducible reviews. Add filters and source links rather than republishing full copyrighted articles.

**Technologies needed:**  
News API, economic-calendar API, NestJS scheduled jobs, Redis, PostgreSQL full-text search, Next.js.

**How the technologies work together:**  
Scheduled NestJS jobs collect provider metadata, Redis controls rate limits and caching, and PostgreSQL indexes normalized events. A matching service connects trades to relevant events, while Next.js presents headlines, timestamps, impact levels, and original-source links.

**Steps:**

1. Select feeds and document licensing and attribution requirements.
2. Build ingestion, normalization, caching, and deduplication.
3. Implement symbol, currency, and temporal event matching.
4. Add trade context panels and event-based analytics.

### 12. Alerts and risk guardrails

**Description:**  
Let users define personal risk rules such as maximum daily loss, consecutive-loss limits, oversized positions, or trading outside planned sessions. Tradel warns users through in-app, email, or push notifications and records whether warnings were followed for later discipline analysis.

**Technical description:**  
Create a versioned rule engine that evaluates trade events and daily aggregates. Publish violations through an event bus, deduplicate notifications, respect quiet hours, and retain an auditable decision record containing the rule version and inputs that triggered it.

**Technologies needed:**  
NestJS, BullMQ, Redis, PostgreSQL, Web Push, email provider, Server-Sent Events or WebSockets.

**How the technologies work together:**  
NestJS evaluates versioned rules when trades change, PostgreSQL stores decisions, and BullMQ with Redis delivers notifications reliably. WebSockets or Server-Sent Events update the interface immediately, while email and Web Push reach users outside the application.

**Steps:**

1. Define rule types, versions, and explainable evaluation results.
2. Implement event-driven evaluation and audit storage.
3. Add notification channels, preferences, and deduplication.
4. Build compliance reports and failure-recovery tests.

---

## Phase 4 — Differentiating portfolio features

### 13. Counterfactual exit and strategy simulator

**Description:**  
Help users test questions such as “What if I always exited at 2R?” or “What if I avoided Fridays?” against their own history. Results must be clearly labeled as simulations, include sample size, and compare the hypothetical equity curve with actual performance.

**Technical description:**  
Build an asynchronous simulation engine over immutable trade snapshots and historical candles. Support constrained, versioned rules for entries, stops, targets, filters, slippage, and fees. Store run parameters and results so simulations are reproducible and never contaminate actual records.

**Technologies needed:**  
NestJS, BullMQ, Redis, PostgreSQL, historical market-data API, Web Workers or worker threads, charting.

**How the technologies work together:**  
NestJS validates simulation definitions, BullMQ distributes compute-heavy runs, historical data supplies candle paths, and PostgreSQL stores reproducible inputs and outputs. The frontend compares actual and hypothetical metrics without presenting backtests as guaranteed future performance.

**Steps:**

1. Define a constrained simulation rule format and assumptions.
2. Build candle-backed execution and cost modeling.
3. Queue runs and persist reproducible results.
4. Add comparison charts, caveats, and correctness benchmarks.

### 14. Explainable personal edge finder

**Description:**  
Automatically surface statistically supported patterns such as the user’s strongest setup, weakest session, costly mistake, or best market condition. Unlike a generic chatbot, every insight should display its evidence, sample size, comparison group, confidence, and linked supporting trades.

**Technical description:**  
Generate candidate segments from approved dimensions, enforce minimum samples, measure effect size and uncertainty, and correct for repeated comparisons. Rank actionable findings and store evidence snapshots. Use deterministic statistics first; optionally let an LLM explain results without calculating them.

**Technologies needed:**  
PostgreSQL, Python analytics service or TypeScript statistics library, NestJS, BullMQ, Redis, optional OpenAI API.

**How the technologies work together:**  
PostgreSQL supplies owner-scoped datasets, a statistics worker discovers and validates patterns, and BullMQ schedules analysis. NestJS exposes evidence-rich insights. An optional language model converts verified numbers into plain language while never receiving authority to invent calculations.

**Steps:**

1. Define candidate dimensions and statistical safety thresholds.
2. Build and validate the deterministic analysis pipeline.
3. Create evidence cards with drill-down trades.
4. Add optional generated explanations and evaluation tests.

### 15. AI-assisted journal coach with user-controlled memory

**Description:**  
Give users a conversational coach that answers questions using their trades, notes, playbooks, and verified analytics. It can draft weekly reviews and suggest experiments, but must cite supporting records, expose uncertainty, avoid financial advice, and let users delete all generated memory.

**Technical description:**  
Use retrieval over owner-scoped notes and structured analytics, with strict authorization before retrieval. Provide tools that return computed metrics and record citations. Add prompt-injection defenses, redaction, token budgets, evaluations, feedback capture, and opt-in retention controls.

**Technologies needed:**  
OpenAI API, embeddings, pgvector, NestJS, PostgreSQL row ownership, background jobs, evaluation framework.

**How the technologies work together:**  
NestJS authorizes every request, pgvector retrieves relevant user-owned text, and structured tools supply trusted calculations. The language model synthesizes cited responses, background jobs draft reviews, and evaluations test grounding, privacy boundaries, refusal behavior, and usefulness.

**Steps:**

1. Define privacy, retention, advice, and citation requirements.
2. Build owner-scoped retrieval and deterministic analytics tools.
3. Implement coaching, review drafts, and source links.
4. Add adversarial evaluations, feedback, and deletion controls.

### 16. Shareable mentor reports and collaborative reviews

**Description:**  
Allow a trader to share selected trades, date ranges, or read-only reports with a mentor or friend. Owners control which fields are visible, can hide monetary values, receive threaded feedback, and revoke access at any time without exposing the rest of their journal.

**Technical description:**  
Create scoped share grants with expirations, hashed public tokens, field-level redaction, and audit events. Resolve all shared content through a dedicated read model. Add threaded comments for invited users and generate immutable report snapshots when reproducibility is required.

**Technologies needed:**  
NestJS, PostgreSQL, Next.js, email provider, signed or hashed tokens, PDF generation, WebSockets.

**How the technologies work together:**  
NestJS evaluates share grants and redaction rules, PostgreSQL stores permissions, snapshots, comments, and audits, and Next.js renders public or invited views. Email distributes invitations, WebSockets update discussions, and PDF generation creates interview-friendly performance reports.

**Steps:**

1. Model grants, visibility rules, expiry, revocation, and audits.
2. Build the redacted shared-report read model.
3. Add invitations, comments, and owner controls.
4. Test privilege boundaries and generate exportable reports.

---

## Suggested portfolio milestone

A strong first public release would include Features 1–9. It would demonstrate a complete product, secure multi-user architecture, asynchronous data processing, meaningful financial analytics, testing, deployment, and thoughtful UX. Features 10–16 can then be released individually as technically distinctive case studies.

For interviews, document each major feature with:

- the user problem and acceptance criteria;
- an architecture decision record and tradeoffs;
- schema or sequence diagrams;
- tests, performance measurements, and failure handling;
- screenshots or a short demo;
- what you would change at larger scale.

