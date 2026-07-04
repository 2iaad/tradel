---
name: file-organizer
description: Clean-code and file-organization standards for the frontend ONLY (frontend/ — Next.js/React/TypeScript). Enforces the 28-line component limit, no prop drilling, separation of concerns, naming, doc comments, and folder structure. Use whenever creating or editing any file under frontend/src. Never apply to backend/ or NestJS code.
---

# Frontend file organizer

**Scope: applies ONLY to `frontend/` (Next.js/React). Never apply these rules to `backend/` or any NestJS code — do not touch the backend.**

## Hard rules

1. **Component size — max 28 lines.** No component function body may exceed 28 lines. When over, extract:
    - subcomponents (new file, or a small private component in the same route folder),
    - custom hooks (`useXxx`) for stateful/effectful logic,
    - pure helpers into `src/lib/`.

2. **No prop drilling.** Props may pass **one** level (parent → child). Anything needed two or more levels deep goes through:
    - React context (pattern: `src/app/dashboard/session.tsx` → `useSessionStore((s) => s.session)`), or
    - composition (`children` / slot props).

3. **One exported component per file.** File name is kebab-case matching the component: `stat-cards.tsx` → `StatCards`. Small private (non-exported) subcomponents may share the file if everything stays within limits.

4. **One-line doc comment** above every exported component, hook, and helper saying what it does. One line, not a block essay.

## Separation of concerns

- Pure logic / formatting → `src/lib/` (e.g. `src/lib/format.ts`).
- Custom hooks → `src/hooks/` (shared) or colocated `use-xxx.ts` next to their only consumer.
- Static data / demo constants → a sibling `*.data.ts` file, never inline in the component file.
- Shared Tailwind class-string constants → `src/lib/ui.ts` (existing pattern). Local one-off class constants may live at the top of their component file.

## Folder structure

```
src/
  app/<route>/          # pages, layouts + route-PRIVATE components colocated
  components/<feature>/ # components shared across routes (e.g. components/auth/)
  components/ui/        # generic primitives (Field, buttons, ...)
  hooks/                # shared custom hooks
  lib/                  # pure functions, api client, ui class constants
```

## Naming

- Components: `PascalCase`. Hooks: `useCamelCase`. Helpers: `camelCase`. Constants: `SCREAMING_SNAKE`.
- Files: kebab-case (`create-account-modal.tsx`, `use-auth-submit.ts`, `dashboard.data.ts`).
- Imports use the `@/` alias, not deep relative paths.

## React/Next hygiene

- Push `"use client"` as low in the tree as possible; keep server components where no interactivity exists.
- Derive state instead of duplicating it; no `useState` for values computable from props/other state.
- Stable `key`s from data, never array index when items reorder.
- No inline mega-objects/functions recreated per render inside big JSX lists — hoist them.
- Match Prettier config (4-space indent, double quotes in frontend).

## Check

Check component sizes after any change:

```bash
cd frontend && npx eslint src --rule '{"max-lines-per-function": ["error", {"max": 28, "skipBlankLines": true, "skipComments": true}]}'
```

The rule flags every function. **Hard failures are components only** (PascalCase functions returning JSX). Custom hooks and pure helpers (e.g. canvas-drawing code in `*.lib.ts` / `use-*.ts`) are exempt from the 28-line cap but should still be split when a smaller unit is natural.
