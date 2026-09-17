# Frontend

The web app uses Next.js App Router, React, TypeScript, Tailwind CSS v4, and Zustand. Run commands from the repository root with Node.js 22.15 or newer in the Node 22 release line.

```bash
npm install
npm run dev:web
npm run check --workspace=@tradel/web
npm run build --workspace=@tradel/web
```

The development server runs on port 5173. `NEXT_PUBLIC_API_URL` is the API origin, without `/api`; it defaults to `http://localhost:3000`. The API client adds `/api` and sends authentication cookies. `NEXT_PUBLIC_REACT_SCAN=1` enables the optional development profiler.

## Where code belongs

```text
src/
├── app/                 Next.js routes, layouts, metadata, global CSS entry
├── features/
│   ├── accounts/        Account selection, account form, store, API types
│   ├── analytics/       Analytics page, charts, store, API types
│   ├── auth/            Persistent auth shell, forms, hooks, session store
│   ├── calendar/        Calendar page, chart, store, API types
│   ├── dashboard/       Dashboard shell, overview, shared dashboard cards
│   ├── demo/            Demo entry page and sample data
│   ├── journal/         Notes page, note form, store, API types
│   ├── landing/         Home page, sections, animations, landing styles
│   ├── settings/        Settings page
│   └── trades/          Trade log, table parts, calculations, store, API types
├── components/
│   ├── brand/           Shared branding
│   ├── dev/             Development tools
│   └── ui/              Shared UI primitives
├── hooks/               Hooks that do not depend on a feature
├── lib/                 API client, formatting, shared style constants, helpers
└── styles/              Global Tailwind theme, tokens, base rules, animations
```

A feature only needs the folders it uses. Screens use `feature-page.tsx`; `components/` contains rendering; `hooks/` contains React state and effects; `lib/` contains plain calculations; `store.ts` owns shared state and API actions; `types.ts` describes API data and payloads. Use lowercase names with hyphens for new files.

Route files delegate to feature screens. Keep metadata and Next.js route exports in `app/`. Keep `'use client'` on modules that need browser APIs or React hooks. The auth shell intentionally keeps all three forms mounted so changing the URL preserves the sliding animation.

Import across features with `@/features/...` and within the same feature with a relative path when it improves readability. Import the file you need directly; avoid broad barrel exports that pull stores and chart libraries into unrelated screens. Shared UI, hooks, and helpers must not import features. Features must not import `app/`. ESLint enforces these boundaries for alias imports.

## State and API calls

Use the shared Axios client in `lib/api.ts`. It handles cookies, one refresh request for concurrent authentication failures, and readable error messages.

Stores own loading, caching, errors, and mutations. Components select only the state they use. Keep account and session subscriptions in the store modules: their request versions prevent an old request from overwriting a newly selected account or user. Import API types from `types.ts`, not a store.

Trade row mapping and statistics are plain functions in `features/trades/lib/`. Keep them independent of hooks and components. Chart-specific equity calculations live in `features/dashboard/lib/`.

## Styling without changing the design

`app/globals.css` defines the cascade and imports the global styles in their existing order. `styles/theme.css` maps Tailwind utilities to variables; `styles/tokens.css` holds color values; `styles/base.css` holds element rules; `styles/animations.css` holds animation rules; `styles/utilities.css` holds the remaining base and utility layers. Shared class strings and canvas colors are in `lib/ui.ts`.

Keep complete Tailwind class names in source. Use the existing `cn()` helper for conditional classes and the existing UI components before adding another variant. Moving a class string should not change its value or the rendered element.

Landing styles stay under `features/landing/styles/`. The large `site.css` and `swiper.css` files are retained theme styles. Their order and `home-theme` layer are deliberate: changing them can alter both the home page and later client navigation. Do not rewrite or reorder them as a cleanup task. Keep font files and public asset URLs stable.

Landing animations are grouped by responsibility in `features/landing/animations/`. `components/home-animation.tsx` keeps the setup order and teardown in one place. Animation timings and selectors are part of the current appearance.

## Checks before a pull request

`npm run check --workspace=@tradel/web` runs lint, TypeScript, all test suites, and formatting checks. `npm run build --workspace=@tradel/web` checks the production bundle and all route entries. The build currently downloads the existing Sora font through `next/font/google` and needs network access.

Tests live in `tests/`. The `test` command uses Node's built-in test runner with `tests/*.test.mjs`. Each file runs in a separate process so singleton stores cannot leak between suites. Add behavior tests for calculations, account switches, cache invalidation, and request races. Tests use Node's built-in runner and the alias resolver in `tests/register.mjs`; no API or database is needed.

For component or style changes, check `/`, `/login`, `/register`, `/reset`, and the `/demo` dashboard flow at desktop and mobile widths. Check navigation, trade filters, row expansion, editing, dialogs, and account switching. Include the relevant checks and any intended visible change in the pull request.
