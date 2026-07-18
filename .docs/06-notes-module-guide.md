# How to build the Notes feature — a full-stack learning guide

Like the accounts guide (`05-accounts-module-guide.md`), this file is not a
copy-paste dump. It walks the **order** of the work and, more importantly,
the **reasoning** at each step — the questions a senior engineer asks
_before_ typing, and how each answer becomes a decision. The code shown is
deliberately plain: no clever generics, no abstractions. Plain code you
fully understand beats smart code you half understand.

Goal at the end: a logged-in user can attach a note (title, body, tags,
optionally linked to one trade) to an account, see notes under trades in the
trade log, and see recent notes on the dashboard.

---

## Part 0 — Think before you code (this is 80% of senior work)

Before writing anything, answer four questions. Write the answers down —
if you can't, you're not ready to code.

### Q1. What already exists?

Inventory first. Never design in a vacuum:

- **DB**: `users`, `refresh_tokens`, `accounts`, `trades` tables exist.
  `notes` does not (check `backend/migrations/`).
- **Backend**: `TradesModule` is a complete, working example of exactly the
  shape we need — nested route under an account, ownership check, raw SQL
  repository. We will copy its shape, not invent a new one.
- **Frontend**: already _stubbed_ for notes. `TradeLogRow` has `noteTitle`,
  `noteBody`, `tags` (always empty), the trade row expands into a
  `NotePanel` with a dead "+ ADD NOTE" button, the dashboard has a "Notes"
  card hardcoded to "NO NOTES YET", and the footer shows "0% WITH NOTES".
  The UI contract was designed before the backend — our job is to fill it.

**The decision this produces:** we are not designing a feature from
scratch; we are _completing a contract that already exists on both ends_.
That kills a whole class of bikeshedding (what fields does a note have? —
the UI already told us: title, body, tags, optional trade link).

### Q2. What is the data model, and who owns what?

A note belongs to an **account**, not directly to a user. Why? Because
everything else in this app is account-scoped (trades are). If notes hung
off `users` directly, filtering "notes for my FTMO account" would need a
different mechanism than "trades for my FTMO account". Consistency beats
micro-optimizations — one mental model for the whole app.

A note can _optionally_ point at one trade (`trade_id` nullable). Two kinds
of notes fall out of one column:

- `trade_id` set → "why I took this exact trade"
- `trade_id` null → standalone journal entry ("today I overtraded")

**Rejected alternative:** a separate `trade_notes` table for trade-linked
notes. Two tables for the same entity = two backends, two stores, two UIs.
One nullable FK does the same job. When a simpler design covers both cases,
take it.

### Q3. What happens on delete? (decide this BEFORE the migration)

Cascade rules are product decisions wearing SQL clothes. Decide them
consciously:

- User deleted → accounts cascade → notes cascade. Nothing should outlive
  its owner. `ON DELETE CASCADE`.
- **Trade deleted → note survives, link cleared.** `ON DELETE SET NULL`.
  Why? The note is the trader's _thinking_ — it's valuable even if the
  trade row is gone. Deleting someone's writing as a side effect of
  deleting a data row would be silent data loss.

If you don't decide this now, Postgres decides for you later with a foreign
key violation at 2am.

### Q4. In what order do I build it?

Bottom-up, always: **table → repository → service → controller → verify
with curl → frontend store → UI**.

Why bottom-up? Because each layer can only be _tested_ if the layer under
it exists. Build the UI first and every bug becomes "is it the UI, the
store, the API, or the DB?" — four suspects. Build bottom-up and verify
each layer before moving on, and every bug has exactly one suspect: the
layer you just wrote.

---

## Step 1 — The migration

```bash
cd backend
npm run migrate:create notes-table
```

Fill the generated file:

```sql
-- Up Migration
CREATE TABLE notes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id  UUID         NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    trade_id    UUID         REFERENCES trades(id) ON DELETE SET NULL,
    title       VARCHAR(120) NOT NULL,
    body        TEXT         NOT NULL,
    tags        TEXT[]       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notes_account_id ON notes (account_id);
CREATE INDEX idx_notes_trade_id ON notes (trade_id);

-- Down Migration
DROP TABLE notes;
```

### Decisions in this file, one by one

- **`tags TEXT[]` instead of a `tags` + `note_tags` join table.** The
  "correct" normalized answer is a join table. We're not doing it. Why:
  the app only ever _displays_ tags on a note; there is no "show me all
  notes tagged #fomo across accounts" feature yet. A join table costs two
  more tables, JOINs in every query, and more repository code — for a
  feature that doesn't exist. If tag-search ships later, migrate then.
  This is YAGNI applied to schema: **normalize when a query needs it, not
  when a textbook says so.**
- **`VARCHAR(120)` on title.** Limits in the DB mirror limits in the DTO
  (Step 3). The DB limit is the last line of defense; the DTO limit is the
  polite error message. You want both: DTOs can be bypassed (a future
  endpoint forgets validation), the DB cannot.
- **Indexes on both FKs.** Every read path we know about filters by
  `account_id` (list notes for account) or `trade_id` (notes for this
  trade). Postgres does not auto-index FK columns — without these, listing
  notes is a full table scan. Index the columns your `WHERE` clauses use,
  nothing more.
- **Down migration is `DROP TABLE`.** Symmetry: down undoes exactly what up
  did. Never skip it — it's what makes mistakes cheap
  (`npm run migrate:down`, fix, `npm run migrate:up`).

Verify before moving on:

```bash
npm run migrate:up
npm run migrate:down   # prove the rollback works
npm run migrate:up     # leave it applied
```

Testing the rollback _now_ takes 10 seconds. Discovering it's broken in six
months takes an afternoon.

---

## Step 2 — Backend: copy the shape you already have

Look at `backend/src/trades/`. Five files, four jobs:

```
notes.controller.ts   → HTTP in, HTTP out. Knows nothing about SQL.
notes.service.ts      → business rules + ownership. Knows nothing about HTTP.
notes.repository.ts   → the ONLY file allowed to write SQL for notes.
dto/                  → what a request body is allowed to look like.
notes.module.ts       → wires it together.
```

Why this split (again, because it matters): each file changes for exactly
one reason. Route rename → controller only. New business rule → service
only. Query optimization → repository only. When a file has one reason to
change, you can change it without fear.

### 2a. The route: nested under accounts

```
POST   /api/accounts/:accountId/notes
GET    /api/accounts/:accountId/notes          (?tradeId=... optional filter)
PATCH  /api/accounts/:accountId/notes/:id
DELETE /api/accounts/:accountId/notes/:id
```

**Why nested and not flat `/api/notes`?** Because the URL then _carries the
ownership context_. Every handler receives `accountId` and can run the same
ownership check trades uses. A flat `/notes` route would need the account
id in the body or query — same information, worse place, and inconsistent
with `/accounts/:accountId/trades`. Consistency is a feature: the next
person (you, in three months) guesses the URL correctly on the first try.

**Why `?tradeId=` as a query param and not a route
(`/trades/:tradeId/notes`)?** Both are defensible. Query param wins here
because it's a _filter on a collection we already have_, not a new
resource. One endpoint, one repository method with an optional `WHERE` —
instead of a second controller path that does 90% the same thing.

### 2b. The ownership check — the security heart of the module

Open `trades.service.ts` and find this:

```ts
private async verifyAccountOwnership(accountId: string, userId: string) {
    const account = await this.accounts.findOne(accountId, userId);
    if (!account) {
        throw new NotFoundException('Account not found');
    }
}
```

Copy it verbatim into `notes.service.ts`. Every public service method calls
it first. Three decisions hide in these six lines:

1. **It lives in the service, not the controller.** The controller's job
   is HTTP translation. If the check lived there, adding a second
   controller (CLI command, cron job, GraphQL later) would silently skip
   security. Business rules live where the business logic lives.
2. **It lives in the service, not the repository.** The repository answers
   "get me rows", not "is this allowed". Mixing authorization into SQL
   makes every query harder to read and the rule impossible to find.
3. **It throws `NotFoundException`, not `ForbiddenException`.** Subtle and
   important: responding 403 to "account exists but isn't yours" _confirms
   the account exists_. That's an information leak — an attacker can
   enumerate valid account ids. 404 for "not yours" and 404 for "doesn't
   exist" are indistinguishable from outside. Standard practice.

Note what this check costs: one extra `SELECT` per request. Could you avoid
it with a JOIN (`... FROM notes JOIN accounts ON ... AND user_id = $2`)?
Yes. Should you? Not yet — the two-query version is _obviously correct_ and
readable, and no one has measured a performance problem. Correct and clear
first; clever after profiling says you must.

### 2c. The repository — plain SQL, parameterised, nothing else

Model it on `trades.repository.ts`. Junior-level code, and that's the
point:

```ts
export interface Note {
    id: string;
    account_id: string;
    trade_id: string | null;
    title: string;
    body: string;
    tags: string[];
    created_at: Date;
}

@Injectable()
export class NotesRepository {
    constructor(private readonly db: DatabaseService) {}

    async create(account_id: string, f: CreateNoteFields): Promise<Note> {
        const { rows } = await this.db.query<Note>(
            `INSERT INTO notes (account_id, trade_id, title, body, tags)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [account_id, f.trade_id ?? null, f.title, f.body, f.tags ?? []],
        );
        return rows[0];
    }

    async findAllByAccount(account_id: string, trade_id?: string): Promise<Note[]> {
        if (trade_id) {
            const { rows } = await this.db.query<Note>(
                `SELECT * FROM notes WHERE account_id = $1 AND trade_id = $2
                 ORDER BY created_at DESC`,
                [account_id, trade_id],
            );
            return rows;
        }
        const { rows } = await this.db.query<Note>(
            `SELECT * FROM notes WHERE account_id = $1 ORDER BY created_at DESC`,
            [account_id],
        );
        return rows;
    }
}
```

Decisions:

- **`$1, $2` placeholders, never string interpolation.** Interpolating user
  input into SQL is SQL injection. Non-negotiable, no exceptions, not even
  "just this once for a quick test".
- **Two explicit queries in `findAllByAccount` instead of one dynamically
  built string.** A senior _could_ build the WHERE clause conditionally
  (trades' `update` does, because 9 optional columns force it). With one
  optional filter, two plain queries are dumber and better — you can read
  each one and know exactly what it does. Choose the boring version until
  the boring version becomes unmanageable.
- **`RETURNING *`** so create/update hand the full row back in one round
  trip — the frontend needs the generated `id` and `created_at` anyway.
- **`WHERE id = $1 AND account_id = $2` on update/delete** (copy trades).
  Even after the ownership check passed, scoping the write to the account
  means a bug elsewhere can't cross account boundaries. Defense in depth:
  each layer assumes the others might fail.
- For `update`, copy the dynamic SET-clause builder from
  `trades.repository.ts` — that one earns its complexity because PATCH
  bodies are partial and `undefined` must mean "don't touch this column",
  not "write NULL".

### 2d. DTOs — validate at the boundary

`dto/create-note.dto.ts`, mirroring `create-trade.dto.ts` style:

```ts
export class CreateNoteDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(120)
    title!: string;

    @IsString()
    @IsNotEmpty()
    body!: string;

    @IsOptional()
    @IsArray()
    @ArrayMaxSize(5)
    @IsString({ each: true })
    @MaxLength(20, { each: true })
    tags?: string[];

    @IsOptional()
    @IsUUID()
    tradeId?: string;
}
```

And the update DTO is one line of real code:

```ts
export class UpdateNoteDto extends PartialType(CreateNoteDto) {}
```

Decisions:

- **Why validate here at all when the DB also has constraints?** Because
  the DTO failure is a friendly 400 with a message the frontend can show;
  the DB failure is a 500 and a stack trace. Validate at the boundary so
  garbage never travels deeper into the system than the front door.
- **`MaxLength(120)` matches `VARCHAR(120)`.** If these drift apart, users
  get the ugly 500 path. When you change one, change both — that's why the
  guide keeps pointing at pairs.
- **`ArrayMaxSize(5)` / `MaxLength(20)` on tags.** Nothing in the DB stops
  a 10,000-tag note. Limits on user input are not optional politeness;
  unbounded input is how databases fill up and UIs break. Pick sane numbers
  now, loosen later if real users complain (they won't).
- **`PartialType(CreateNoteDto)`** — update accepts the same fields, all
  optional, same validators. One source of truth for what a note looks
  like. Hand-writing a second DTO that duplicates every rule is how the two
  drift.
- **Validation only runs because `main.ts` has
  `app.useGlobalPipes(new ValidationPipe())`** — already set up. Know _why_
  your decorators work, not just that they do.

One business rule belongs in the **service**, not the DTO: if `tradeId` is
provided, check the trade exists _in this account_ before inserting.
Why not let the FK constraint catch it? Same 400-vs-500 reasoning — and the
DB constraint only checks the trade exists _somewhere_, not that it's in
the caller's account. That cross-account check is exactly the kind of rule
only the service layer can express.

### 2e. The module + AppModule

Copy `trades.module.ts` exactly: import `AccountsModule` (it exports
`AccountsRepository` for the ownership check) and the same
`JwtModule.registerAsync` block so `JwtGuard` can verify tokens here.

Yes, the JwtModule config is now duplicated in a third place. Noticing that
is good instinct. Resisting the urge to refactor it _in this PR_ is better
instinct: **one PR, one purpose.** Mixing "add notes" with "refactor JWT
setup" means a bug in either reverts both. Write it down, refactor next PR.

Then register `NotesModule` in `app.module.ts` imports — forget this and
Nest simply never mounts your routes (the classic "why is everything 404"
hour).

### 2f. Verify the backend alone — before any frontend exists

Layer discipline again. Swagger is already set up (`/api` docs), or curl:

```bash
# login, grab the access token
curl -s http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","password":"..."}'

# create a note (use a real accountId from GET /api/accounts)
curl -s http://localhost:3000/api/accounts/<accountId>/notes \
  -H "Authorization: Bearer <token>" \
  -H 'Content-Type: application/json' \
  -d '{"title":"Chased the open","body":"No level, no plan.","tags":["fomo"]}'
```

Test the _unhappy_ paths too — that's where the engineering is:

- another user's `accountId` → expect **404** (not 403, not 200)
- no token → **401**
- title longer than 120 chars → **400** with a clear message
- `tradeId` from a different account → **400/404**, and no row inserted

A feature is "working" when the failure cases fail correctly, not when the
happy path succeeds.

---

## Step 3 — Frontend

### 3a. The store — `frontend/src/stores/notes.ts`

Project convention (see `stores/trades.ts`): server state lives in a
zustand store, and **API calls live inside store actions** — not in
components, not in ad-hoc hooks. Why the rule: any component can read
`useNotesStore((s) => s.notes)` and they all agree, because there is
exactly one copy of the data and one place that mutates it.

Model it directly on the trades store — same `ApiNote` interface mirroring
the API row (snake_case, since the backend returns DB column names), same
`load / saveNote / removeNote` actions, same `loading` / `error` fields,
same guard: do nothing when `session.status !== 'user'`.

**Why a separate notes store instead of adding notes to the trades store?**
Different resource, different lifecycle (notes can load lazily when a row
expands; trades load on page mount). Merging them couples every notes
change to a re-render of everything watching trades. Same reasoning as
backend modules: one store per resource.

The one design question worth pausing on: **how do trade rows find their
notes?** Options:

1. Backend JOINs notes into the trades response.
2. Frontend loads all notes for the account once, builds a
   `Map<tradeId, Note[]>`.

Take option 2. Reason: the trades endpoint stays untouched (no backend
change, no risk to a working feature), and a journal has maybe hundreds of
notes — one fetch is nothing. Option 1 becomes attractive only when data
volume makes "fetch all" wasteful. Note the habit: _quantify_ before
optimizing. "Hundreds of rows" is not a performance problem.

### 3b. Wire the stubs (smallest diff possible)

The UI already exists — this step is filling holes, not building screens:

- `trades/use-trade-log.ts` → `toTradeLogRow` currently hardcodes
  `noteTitle: ""`. Look up the trade's first note from the notes store map
  instead. `notedPct` in the summary starts working by itself — it already
  counts `noteTitle`.
- `trades/trade-row.tsx` → `NotePanel`'s "+ ADD NOTE" button gets an
  inline form (title + body), submitting via `saveNote` with the trade's
  id. Copy the inline-form pattern from `TradeRowForm` — same look, same
  `useAuthSubmit` error handling. Reuse the pattern the codebase already
  has; don't invent a second way to do forms.
- `dashboard/page.tsx` → `NotesList` renders the latest ~5 notes from the
  store instead of the hardcoded empty state.
- `/dashboard/journal/page.tsx` → the full notes page: list, standalone
  note composer. This is the biggest new surface; do it _last_, after the
  small wirings proved the store works.

Order within this step is deliberate too: smallest integration first
(NotesList read-only), the risky one last. Every step ships a visibly
working slice.

---

## Step 4 — What we deliberately did NOT build

Writing down what you skipped is as important as what you built — it turns
"forgot" into "decided":

- **No pagination** — journal note volume doesn't justify it. Add when an
  account has thousands of notes.
- **No note editing history / soft delete** — real feature, real cost, no
  one asked for it.
- **No tag search / autocomplete** — needs the join table from Step 1's
  discussion. The `TEXT[]` column doesn't block it; migrate when it ships.
- **No markdown rendering in body** — plain text until users want more.
- **No `updated_at`** — add the column when edit-heavy usage appears.

Each of these is one sentence in a future ticket. None of them should delay
notes shipping this week.

---

## Checklist (the definition of "done")

- [ ] `notes` table migrated; `migrate:down` tested once
- [ ] `NotesModule` registered in `AppModule`; routes visible in Swagger
- [ ] Ownership: other user's account → 404 on every endpoint
- [ ] Validation: oversized title/tags → 400 with readable message
- [ ] `tradeId` from another account rejected
- [ ] `stores/notes.ts` — load/save/remove, API calls inside actions
- [ ] Trade row expand shows real note; "+ ADD NOTE" saves
- [ ] Dashboard Notes card shows latest notes; "% WITH NOTES" is real
- [ ] `/dashboard/journal` lists notes + standalone composer
- [ ] `npm run lint` + `npx tsc --noEmit` clean in both apps

The meta-lesson, if you keep only one thing: **at every step there was a
"smarter" option — join tables, JOINed endpoints, dynamic SQL, shared JWT
config, one mega-store — and at every step we took the boring one and wrote
down when the smart one becomes worth it.** That's the actual senior skill:
not knowing the advanced technique, but knowing the moment it starts paying
rent.
