# Database Migrations (Raw SQL, No ORM)

## Why the current `migrate.ts` is not enough

The one-off script from `04-db-and-auth.md` works to create the first table, but it has real problems the moment your schema grows:

| Problem             | What happens                                                                                 |
| ------------------- | -------------------------------------------------------------------------------------------- |
| **No history**      | You can't tell which changes have already run against a given database.                      |
| **Not repeatable**  | `CREATE TABLE IF NOT EXISTS` silently skips — so if you _change_ the table, nothing happens. |
| **No rollback**     | If a change is wrong, there's no clean "undo".                                               |
| **No ordering**     | With 10 changes, you'd be manually editing one big SQL blob and hoping.                      |
| **Team/Prod drift** | Your DB, a teammate's DB, and production all end up in different states.                     |

A **migration** solves all of this. It is just:

> A small, **ordered**, **immutable** SQL file describing one change to the schema — plus a record, kept _inside the database itself_, of which files have already been applied.

That last part is the key idea: the database keeps a table (e.g. `pgmigrations`) listing every migration that has run. To bring any database up to date, the tool compares the files on disk against that table and runs only what's missing, **in order**.

---

## The tool: `node-pg-migrate`

You said no ORM — good news: **`node-pg-migrate` is not an ORM.** It does not generate models, it does not wrap your queries, it does not hide SQL. It is a thin CLI that:

1. runs your `.sql` files in order,
2. records them in a `pgmigrations` table,
3. supports `up` (apply) and `down` (roll back).

You keep writing raw SQL. It just manages _when_ and _whether_ each file runs. It's the standard choice for the `pg` + no-ORM setup.

> Alternative tools: `sql-migrate`, `dbmate`, or Postgres' own tooling. They all share the same model above. I'm recommending `node-pg-migrate` because it's TS-friendly and already plays well with your `pg` stack.

---

## 1. Install

```bash
npm install -D node-pg-migrate
```

(`pg` is already installed, which it needs as a peer.)

---

## 2. How it connects — `DB_URL`

`node-pg-migrate` connects with a single connection string in the `DB_URL` env var. Your app uses individual `DB_*` vars, so add the assembled URL alongside them.

`.env` (note: `.env` does **not** interpolate `${...}`, so write the values literally):

```env
# existing individual vars stay as-is (NestJS uses these)
DB_NAME=tradel
DB_USER=tradel_user
DB_PASSWORD=your_secure_password
DB_PORT=5433
DB_HOST=localhost

# new: same credentials as one URL (node-pg-migrate uses this)
DB_URL=postgres://tradel_user:your_secure_password@localhost:5433/tradel
```

Add it to `.env.example` too:

```env
DB_URL=postgres://XXXX:XXXX@XXXX:XXXX/XXXX
```

And register it in `src/config/env.validation.ts` so a missing/typo'd URL fails loudly like the rest:

```ts
// inside envSchema, in the // db section
DB_URL: z.string().url(),
```

> `node-pg-migrate` auto-loads `.env`, so once `DB_URL` is there the CLI just finds it.

---

## 3. Add npm scripts

In `package.json`, under `"scripts"`:

```jsonc
"migrate": "node-pg-migrate -d DB_URL",
"migrate:up": "node-pg-migrate up -d DB_URL",
"migrate:down": "node-pg-migrate down -d DB_URL",
"migrate:create": "node-pg-migrate create --migration-file-language sql"
```

> **Why the `-d DB_URL`?** `node-pg-migrate` looks for a connection string in `DATABASE_URL` by default. We named ours `DB_URL` (to match the `DB_*` family), so `-d DB_URL` tells the CLI which env var to read. `migrate:create` doesn't touch the database — it only writes a file — so it needs no `-d`.

### What each command does

| Command | What it does | Touches the DB? |
| --- | --- | --- |
| `npm run migrate:create <name>` | Creates a new **empty** timestamped `.sql` file in `migrations/`. You then fill in the Up/Down SQL. | No — just writes a file |
| `npm run migrate:up` | Looks at every file in `migrations/`, checks the `pgmigrations` ledger, and runs the **Up** section of any file not yet applied, **in order**. | Yes |
| `npm run migrate:down` | Runs the **Down** section of the **single most recent** applied migration, and removes its row from the ledger. | Yes |
| `npm run migrate` | The bare CLI. You rarely call this directly; it's the base the others build on (e.g. `npm run migrate -- redo`). | Depends |

Mental model: **`create` makes the file, `up` applies, `down` undoes.** `up` and `down` are inverses; `up` is safe to run any time (it only runs what's pending — running it twice does nothing).

### When do I use each while building the API?

A schema change always follows the same loop. Say you're adding a `wallets` table for a new feature:

```bash
# 1. Scaffold the file (run ONCE per change)
npm run migrate:create create_wallets_table
#    → migrations/<timestamp>_create-wallets-table.sql

# 2. Open that file and write BOTH sections by hand:
#    -- Up Migration
#    CREATE TABLE wallets ( ... );
#    -- Down Migration
#    DROP TABLE wallets;

# 3. Apply it to your local DB
npm run migrate:up

# 4. Now write the NestJS code that reads/writes that table.
```

- **`migrate:create`** — only when you need a *new* schema change. Not every time you code; only when the database shape changes (new table, new column, new index, etc.).
- **`migrate:up`** — after writing a migration to apply it locally; also after `git pull` when a teammate added migrations you don't have yet; and in production as a deploy step.
- **`migrate:down`** — when you got the migration wrong **and haven't committed/shared it yet**: roll back, edit the file, `up` again. Once a migration is committed and others have run it, **don't** `down`+edit — write a *new* migration instead (see the Golden Rule in §7).

> Made a mistake mid-development? `migrate:down` → fix the file → `migrate:up`. That edit-loop is fine **only** while the migration is still yours alone (uncommitted, unshared).

---

## 4. Where migrations live

By default `node-pg-migrate` uses a top-level `migrations/` folder. Create your first one:

```bash
npm run migrate:create create_users_table
```

This generates a timestamped file so ordering is guaranteed forever:

```
migrations/
└── 1718800000000_create-users-table.sql
```

> The numeric prefix is a timestamp. It's what makes order **deterministic** — never rename or reorder these files after they've run.

---

## 5. Write the migration (raw SQL)

A SQL migration has two clearly marked sections. Open the generated file and fill it in:

```sql
-- Up Migration
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username    VARCHAR(15)  NOT NULL UNIQUE,
    email       VARCHAR(50)  NOT NULL UNIQUE,
    password    TEXT         NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Down Migration
DROP TABLE users;
```

Notes that make this **correct**:

- **No `IF NOT EXISTS`.** A migration runs exactly once, so it can assume a clean slate. `IF NOT EXISTS` hides mistakes — if the table already exists, that's a real problem you want to see, not swallow.
- **The `Down` is the exact inverse of the `Up`.** `Up` creates → `Down` drops. This is what makes rollback trustworthy. Always write the down at the same time as the up, while the change is fresh in your head.
- `gen_random_uuid()` is built into PostgreSQL 13+ (your image is PG16), so no extension needed.

---

## 6. Run it

Make sure the database container is up first, then apply:

```bash
docker compose up -d        # start Postgres
npm run migrate:up          # apply pending migrations
```

Expected output names each file it ran. Verify in the DB:

```bash
docker exec -it my-postgres-container psql -U tradel_user -d tradel -c "\dt"
```

You'll see **two** tables: `users` and `pgmigrations`. Peek at the bookkeeping table:

```bash
docker exec -it my-postgres-container psql -U tradel_user -d tradel -c "SELECT * FROM pgmigrations;"
```

That row is the database remembering it ran your migration. Run `npm run migrate:up` again — it does nothing, because there's nothing pending. That idempotency is the whole point.

To undo the last one:

```bash
npm run migrate:down        # runs the "-- Down Migration" section
```

---

## 7. The everyday workflow from here

Every future schema change is the same three steps:

```bash
# 1. scaffold
npm run migrate:create add_avatar_to_users

# 2. edit migrations/<timestamp>_add-avatar-to-users.sql
#    -- Up:   ALTER TABLE users ADD COLUMN avatar_url TEXT;
#    -- Down: ALTER TABLE users DROP COLUMN avatar_url;

# 3. apply
npm run migrate:up
```

**Golden rule:** once a migration has been committed/run, it is **immutable**. Never edit it. Need a fix? Write a _new_ migration. Editing an applied file means your DB and the file disagree, and nobody downstream will pick up the change.

---

## 8. How this replaces the old script

- **Delete** `src/database/migrate.ts` — `node-pg-migrate` fully replaces it.
- Your `database/init.sh` (the Docker entrypoint) still does its job: it creates the **role and the database** on first boot. That's infrastructure.
- Migrations own everything **inside** the database (tables, columns, indexes). Clean separation:

    | Layer      | Owns                        | Lives in      |
    | ---------- | --------------------------- | ------------- |
    | `init.sh`  | the database + user exist   | Docker image  |
    | migrations | the schema (tables/columns) | `migrations/` |
    | NestJS     | reads/writes rows           | `src/`        |

---

## 9. Production note

In dev you run `npm run migrate:up` by hand. In production you run the _same command_ as a deploy step **before** the new app code starts — so the schema is always ahead of (or equal to) the code that depends on it. Same files, same tool, no surprises.

---

## Key Points to Remember

- A migration tool's real value is the **`pgmigrations` ledger** inside the DB — it's what lets any database catch up to exactly the right state, in order, once each.
- `node-pg-migrate` is **not an ORM**: you still write raw SQL. It only manages ordering, state, and up/down.
- Timestamped filenames guarantee order — **never rename or reorder** them.
- **Migrations are immutable once applied.** Fix forward with a new migration; never edit an old one.
- Always write the **`Down`** section at the same time as the `Up` — it's your rollback insurance.
- Drop `IF NOT EXISTS` in migrations — each runs exactly once on a known state, so defensive guards only hide bugs.
- Keep `init.sh` (creates DB + user) and migrations (create schema) separate — different layers, different jobs.
