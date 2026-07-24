import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

// Aggregate rows returned by the analytics SQL. NUMERIC sums come back as
// strings over the pg driver — the service parses them into numbers.
export interface SummaryRow {
    closed: string; // count of closed trades (pnl not null)
    open: string; // count of open trades (pnl null)
    wins: string;
    net: string | null; // sum(pnl)
    gross_win: string | null; // sum(pnl) where pnl > 0
    gross_loss: string | null; // sum(pnl) where pnl < 0 (negative)
    avg_r: string | null; // avg(r) where r not null
}

export interface BreakdownRow {
    label: string; // symbol or side
    net: string | null;
    wins: string;
    count: string;
}

export interface CalendarRow {
    day: string; // 'YYYY-MM-DD'
    pnl: string | null;
    trades: string;
}

@Injectable()
export class AnalyticsRepository {
    constructor(private readonly db: DatabaseService) {}

    async summary(accountId: string): Promise<SummaryRow> {
        const { rows } = await this.db.query<SummaryRow>(
            `SELECT
                COUNT(*) FILTER (WHERE pnl IS NOT NULL)          AS closed,
                COUNT(*) FILTER (WHERE pnl IS NULL)              AS open,
                COUNT(*) FILTER (WHERE pnl > 0)                  AS wins,
                SUM(pnl)                                         AS net,
                SUM(pnl) FILTER (WHERE pnl > 0)                  AS gross_win,
                SUM(pnl) FILTER (WHERE pnl < 0)                  AS gross_loss,
                AVG(r)   FILTER (WHERE r IS NOT NULL)            AS avg_r
            FROM trades
            WHERE account_id = $1`,
            [accountId],
        );
        return rows[0];
    }

    // Grouped P&L by symbol or side. Column name is validated in the service —
    // never interpolate raw user input here.
    async breakdown(accountId: string, column: 'symbol' | 'side'): Promise<BreakdownRow[]> {
        const { rows } = await this.db.query<BreakdownRow>(
            `SELECT
                ${column}                          AS label,
                SUM(pnl)                           AS net,
                COUNT(*) FILTER (WHERE pnl > 0)    AS wins,
                COUNT(*) FILTER (WHERE pnl IS NOT NULL) AS count
            FROM trades
            WHERE account_id = $1 AND pnl IS NOT NULL
            GROUP BY ${column}
            ORDER BY net DESC NULLS LAST`,
            [accountId],
        );
        return rows;
    }

    // Daily net P&L + trade count for one month, grouped by created_at (the
    // trade's only timestamp). `month` is the first day of the month (UTC).
    async calendar(accountId: string, monthStart: string): Promise<CalendarRow[]> {
        const { rows } = await this.db.query<CalendarRow>(
            `SELECT
                to_char(created_at, 'YYYY-MM-DD') AS day,
                SUM(pnl)                          AS pnl,
                COUNT(*)                          AS trades
            FROM trades
            WHERE account_id = $1
              AND created_at >= $2::timestamptz
              AND created_at <  ($2::timestamptz + INTERVAL '1 month')
            GROUP BY day
            ORDER BY day`,
            [accountId, monthStart],
        );
        return rows;
    }
}
