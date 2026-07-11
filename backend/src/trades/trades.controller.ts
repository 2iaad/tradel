import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Req,
    HttpCode,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { TradesService } from './trades.service';
import { CreateTradeDto } from './dto/create-trade.dto';
import { UpdateTradeDto } from './dto/update-trade.dto';

@Controller('accounts/:accountId/trades')
@UseGuards(JwtGuard)
export class TradesController {
    constructor(private readonly tradesService: TradesService) {}

    // POST /accounts/:accountId/trades — log a new trade under the account.
    @Post()
    create(
        @Param('accountId') accountId: string,
        @Body() createTradeDto: CreateTradeDto,
        @Req() req: Request,
    ) {
        return this.tradesService.create(accountId, req.user.sub, createTradeDto);
    }

    // GET /accounts/:accountId/trades — list every trade in the account.
    @Get()
    findAll(@Param('accountId') accountId: string, @Req() req: Request) {
        return this.tradesService.findAll(accountId, req.user.sub);
    }

    // GET /accounts/:accountId/trades/:id — fetch one trade by id.
    @Get(':id')
    findOne(@Param('accountId') accountId: string, @Param('id') id: string, @Req() req: Request) {
        return this.tradesService.findOne(id, accountId, req.user.sub);
    }

    // PATCH /accounts/:accountId/trades/:id — update a trade (partial body).
    @Patch(':id')
    update(
        @Param('accountId') accountId: string,
        @Param('id') id: string,
        @Body() updateTradeDto: UpdateTradeDto,
        @Req() req: Request,
    ) {
        return this.tradesService.update(id, accountId, req.user.sub, updateTradeDto);
    }

    // DELETE /accounts/:accountId/trades/:id — remove a trade.
    @Delete(':id')
    @HttpCode(204)
    remove(@Param('accountId') accountId: string, @Param('id') id: string, @Req() req: Request) {
        return this.tradesService.remove(id, accountId, req.user.sub);
    }
}
