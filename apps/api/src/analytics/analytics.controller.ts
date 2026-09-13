import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { AnalyticsService } from './analytics.service';
import { ApiCookieAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('analytics')
@ApiCookieAuth('access_token')
@Controller('accounts/:accountId/analytics')
@UseGuards(JwtGuard)
export class AnalyticsController {
    constructor(private readonly analytics: AnalyticsService) {}

    // GET .../analytics/summary — headline stats for the account.
    @Get('summary')
    @ApiOperation({ summary: 'Get account performance summary' })
    summary(@Param('accountId') accountId: string, @Req() req: Request) {
        return this.analytics.summary(accountId, req.user.sub);
    }

    // GET .../analytics/breakdown?by=symbol|side — grouped P&L.
    @Get('breakdown')
    @ApiOperation({ summary: 'Group account results by symbol or side' })
    @ApiQuery({ name: 'by', enum: ['symbol', 'side'], required: true })
    breakdown(@Param('accountId') accountId: string, @Query('by') by: string, @Req() req: Request) {
        return this.analytics.breakdown(accountId, req.user.sub, by);
    }

    // GET .../analytics/calendar?month=YYYY-MM — daily P&L for one month.
    @Get('calendar')
    @ApiOperation({ summary: 'Get daily account results for one month' })
    @ApiQuery({
        name: 'month',
        required: false,
        example: '2026-09',
        description: 'Month in YYYY-MM format; defaults to the current month',
    })
    calendar(
        @Param('accountId') accountId: string,
        @Query('month') month: string,
        @Req() req: Request,
    ) {
        return this.analytics.calendar(accountId, req.user.sub, month);
    }
}
