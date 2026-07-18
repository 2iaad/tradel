import { Module } from '@nestjs/common';

import { NotesController } from './notes.controller';
import { AccountNotesController } from './account-notes.controller';
import { NotesService } from './notes.service';
import { NotesRepository } from './notes.repository';

import { AccountsModule } from 'src/accounts/accounts.module';
import { TradesModule } from 'src/trades/trades.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Env } from 'src/config/env.validation';

/*
Mistakes i have done:

    - forgot Jwt guard that protects the route
    - included the Repositories i needed in the providers section:
        -> this created duplicate instances of the dependencies
        -> and bypassed the DI concept

 */

@Module({
    imports: [
        AccountsModule,
        TradesModule,
        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService<Env>) => ({
                secret: config.get('JWT_ACCESS_SECRET', { infer: true }),
                signOptions: {
                    expiresIn: config.get('JWT_ACCESS_TTL', { infer: true }),
                },
            }),
        }),
    ],
    controllers: [NotesController, AccountNotesController],
    providers: [NotesService, NotesRepository],
})
export class NotesModule {}

/* ─────────────────────────────────────────────
   NOTES MODULE — SENIOR AUDIT (layer 0 → module)

   VERDICT: ready to use. Compiles, builds, DI wired.

   Layer 0 — Repository (notes.repository.ts)
     + Parameterised SQL, every method owner-scoped (account_id).
     + COALESCE update; findOne/remove return null/bool cleanly.
     - No 23503 handling: FK violation surfaces as 500 IF the
       service check is ever bypassed (service covers it today).

   Layer 1 — Service (notes.service.ts)
     + create verifies account AND trade ownership before insert.
     + findOne/update/remove throw 404 on missing row. Consistent.
     + Trade check turns raw FK 500 into clean 404.

   Layer 2 — Controllers (2 files, split by scope)
     + JwtGuard on class; userId from req.user.sub (never trusted body).
     + UUID ids kept as strings; DELETE → 204.
     + notes.controller.ts        → POST under trade (create only).
       account-notes.controller.ts → GET/PATCH/DELETE under account.
       No dead URL params — each route uses every param it declares.

   Layer 3 — Module (this file)
     + Imports AccountsModule/TradesModule for their exported repos —
       no duplicate instances, DI respected.
     + JwtModule registered so JwtGuard can inject JwtService.
     + DatabaseService omitted correctly (it is @Global).

   FOLLOW-UPS (non-blocking):
     1. Optional: catch 23503 in repo as a safety net.
   ───────────────────────────────────────────── */
