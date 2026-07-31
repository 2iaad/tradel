import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AccountsRepository } from 'src/accounts/accounts.repository';
import { AnalyticsRepository } from './analytics.repository';

// Shapes returned to the client. Numbers are already parsed; ratio-style
// fields are null when undefined (no closed trades / no losses) so the UI can
// render "—" instead of NaN/Infinity.
export interface AnalyticsSummary {
    closed: number;
    open: number;
    wins: number;
    losses: number;
    net: number;
    winRate: number | null; // 0..1
    profitFactor: number | null; // grossWin / |grossLoss|
    expectancy: number | null; // net / closed
    avgR: number | null;
}

export interface BreakdownEntry {
    label: string;
    net: number;
    wins: number;
    count: number;
    winRate: number | null;
}

export interface CalendarDay {
    date: string; // 'YYYY-MM-DD'
    pnl: number;
    trades: number;
}

const num = (v: string | null) => (v === null ? 0 : parseFloat(v));

@Injectable()
export class AnalyticsService {
    constructor(
        private readonly analytics: AnalyticsRepository,
        private readonly accounts: AccountsRepository,
    ) {}

    private async verifyOwnership(accountId: string, userId: string) {
        const account = await this.accounts.findOne(accountId, userId);
        if (!account) throw new NotFoundException('Account not found');
    }

    async summary(accountId: string, userId: string): Promise<AnalyticsSummary> {
        await this.verifyOwnership(accountId, userId);
        const r = await this.analytics.summary(accountId);
        const closed = Number(r.closed);
        const wins = Number(r.wins);
        const net = num(r.net);
        const grossWin = num(r.gross_win);
        const grossLoss = Math.abs(num(r.gross_loss));
        return {
            closed,
            open: Number(r.open),
            wins,
            losses: closed - wins,
            net,
            winRate: closed ? wins / closed : null,
            profitFactor: grossLoss ? grossWin / grossLoss : null,
            expectancy: closed ? net / closed : null,
            avgR: r.avg_r === null ? null : parseFloat(r.avg_r),
        };
    }

    async breakdown(
        accountId: string,
        userId: string,
        by: string | undefined,
    ): Promise<BreakdownEntry[]> {
        await this.verifyOwnership(accountId, userId);
        if (by !== 'symbol' && by !== 'side')
            throw new BadRequestException("Query param 'by' must be 'symbol' or 'side'");
        const rows = await this.analytics.breakdown(accountId, by);
        return rows.map((row) => {
            const count = Number(row.count);
            const wins = Number(row.wins);
            return {
                label: row.label,
                net: num(row.net),
                wins,
                count,
                winRate: count ? wins / count : null,
            };
        });
    }

    async calendar(
        accountId: string,
        userId: string,
        month: string | undefined,
    ): Promise<CalendarDay[]> {
        await this.verifyOwnership(accountId, userId);
        // Accept 'YYYY-MM'; default to the current month. Normalize to the
        // first-of-month UTC timestamp the SQL window expects.
        const m = month ?? new Date().toISOString().slice(0, 7);
        if (!/^\d{4}-\d{2}$/.test(m))
            throw new BadRequestException("Query param 'month' must be 'YYYY-MM'");
        const rows = await this.analytics.calendar(accountId, `${m}-01T00:00:00Z`);
        return rows.map((row) => ({
            date: row.day,
            pnl: num(row.pnl),
            trades: Number(row.trades),
        }));
    }
}
