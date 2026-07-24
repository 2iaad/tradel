import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { AnalyticsService } from './analytics.service';

@Controller('accounts/:accountId/analytics')
@UseGuards(JwtGuard)
export class AnalyticsController {
    constructor(private readonly analytics: AnalyticsService) {}

    // GET .../analytics/summary — headline stats for the account.
    @Get('summary')
    summary(@Param('accountId') accountId: string, @Req() req: Request) {
        return this.analytics.summary(accountId, req.user.sub);
    }

    // GET .../analytics/breakdown?by=symbol|side — grouped P&L.
    @Get('breakdown')
    breakdown(
        @Param('accountId') accountId: string,
        @Query('by') by: string,
        @Req() req: Request,
    ) {
        return this.analytics.breakdown(accountId, req.user.sub, by);
    }

    // GET .../analytics/calendar?month=YYYY-MM — daily P&L for one month.
    @Get('calendar')
    calendar(
        @Param('accountId') accountId: string,
        @Query('month') month: string,
        @Req() req: Request,
    ) {
        return this.analytics.calendar(accountId, req.user.sub, month);
    }
}
