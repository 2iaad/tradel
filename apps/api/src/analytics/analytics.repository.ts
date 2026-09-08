import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

// Counts and NUMERIC aggregates are cast to text so the existing service can
// keep parsing the same string values it received before Prisma.
export interface SummaryRow {
    closed: string; // count of closed trades (pnl not null)
    open: string; // count of open trades (pnl null)
    wins: string;
    net: string | null; // sum(pnl)
    gross_win: string | null; // sum(pnl) where pnl > 0
    gross_loss: string | null; // sum(pnl) where pnl < 0 (negative)
    avg_r: string | null; // avg(risk_reward) where risk_reward not null
}

export interface BreakdownRow {
    label: string; // symbol or side
    net: string | null;
    wins: string;
    count: string;
}

export interface CalendarRow {
    day: string;
    pnl: string | null;
    trades: string;
    items: Array<{
        symbol: string;
        pnl: number | null;
    }>;
}

@Injectable()
export class AnalyticsRepository {
    constructor(private readonly prisma: PrismaService) {}

    async summary(accountId: string): Promise<SummaryRow> {
        const rows = await this.prisma.$queryRaw<SummaryRow[]>`
            SELECT
                (COUNT(*) FILTER (WHERE pnl IS NOT NULL))::text  AS closed,
                (COUNT(*) FILTER (WHERE pnl IS NULL))::text      AS open,
                (COUNT(*) FILTER (WHERE pnl > 0))::text          AS wins,
                SUM(pnl)::text                                   AS net,
                (SUM(pnl) FILTER (WHERE pnl > 0))::text          AS gross_win,
                (SUM(pnl) FILTER (WHERE pnl < 0))::text          AS gross_loss,
                (AVG(risk_reward) FILTER (
                    WHERE risk_reward IS NOT NULL
                ))::text                                         AS avg_r
            FROM trades
            WHERE account_id = ${accountId}::uuid
        `;
        return rows[0];
    }

    // Use fixed queries so a column name is never inserted into raw SQL.
    async breakdown(accountId: string, column: 'symbol' | 'side'): Promise<BreakdownRow[]> {
        if (column === 'symbol') {
            return this.prisma.$queryRaw<BreakdownRow[]>`
                SELECT
                    symbol                                          AS label,
                    SUM(pnl)::text                                  AS net,
                    (COUNT(*) FILTER (WHERE pnl > 0))::text          AS wins,
                    (COUNT(*) FILTER (WHERE pnl IS NOT NULL))::text  AS count
                FROM trades
                WHERE account_id = ${accountId}::uuid AND pnl IS NOT NULL
                GROUP BY symbol
                ORDER BY SUM(pnl) DESC NULLS LAST
            `;
        }

        return this.prisma.$queryRaw<BreakdownRow[]>`
            SELECT
                side                                            AS label,
                SUM(pnl)::text                                  AS net,
                (COUNT(*) FILTER (WHERE pnl > 0))::text          AS wins,
                (COUNT(*) FILTER (WHERE pnl IS NOT NULL))::text  AS count
            FROM trades
            WHERE account_id = ${accountId}::uuid AND pnl IS NOT NULL
            GROUP BY side
            ORDER BY SUM(pnl) DESC NULLS LAST
        `;
    }

    async calendar(accountId: string, monthStart: string): Promise<CalendarRow[]> {
        return this.prisma.$queryRaw<CalendarRow[]>`
            SELECT
                to_char(created_at, 'YYYY-MM-DD')  AS day,
                SUM(pnl)::text                     AS pnl,
                COUNT(*)::text                     AS trades,
                COALESCE(
                    json_agg(
                        json_build_object('symbol', symbol, 'pnl', pnl)
                        ORDER BY created_at, id
                    ),
                    '[]'::json
                )                                 AS items
            FROM trades
            WHERE account_id = ${accountId}::uuid
              AND created_at >= ${monthStart}::timestamptz
              AND created_at < (${monthStart}::timestamptz + INTERVAL '1 month')
            GROUP BY day
            ORDER BY day
        `;
    }
}
