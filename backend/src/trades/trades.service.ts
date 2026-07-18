import { Injectable, NotFoundException } from '@nestjs/common';
import { AccountsRepository } from 'src/accounts/accounts.repository';
import { TradesRepository } from './trades.repository';
import { CreateTradeDto } from './dto/create-trade.dto';
import { UpdateTradeDto } from './dto/update-trade.dto';

@Injectable()
export class TradesService {
    constructor(
        private readonly trades: TradesRepository,
        private readonly accounts: AccountsRepository,
    ) {}

    private async verifyAccountOwnership(accountId: string, userId: string) {
        const account = await this.accounts.findOne(accountId, userId);
        if (!account) {
            throw new NotFoundException('Account not found');
        }
    }

    async create(accountId: string, userId: string, dto: CreateTradeDto) {
        await this.verifyAccountOwnership(accountId, userId);
        const pnl = this.computePnl(dto.side, dto.entry, dto.exit, dto.size);
        return this.trades.create(accountId, {
            symbol: dto.symbol,
            side: dto.side,
            entry: dto.entry,
            exit: dto.exit,
            size: dto.size,
            pnl,
            opened_at: dto.openedAt,
            closed_at: dto.closedAt,
        });
    }

    async findAll(accountId: string, userId: string) {
        await this.verifyAccountOwnership(accountId, userId);
        return this.trades.findAllByAccount(accountId);
    }

    async findOne(id: string, accountId: string, userId: string) {
        await this.verifyAccountOwnership(accountId, userId);
        const trade = await this.trades.findOne(id, accountId);
        if (!trade) {
            throw new NotFoundException('Trade not found');
        }
        return trade;
    }

    async update(id: string, accountId: string, userId: string, dto: UpdateTradeDto) {
        await this.verifyAccountOwnership(accountId, userId);
        const pnl =
            dto.exit !== undefined
                ? this.computePnl(dto.side, dto.entry, dto.exit, dto.size)
                : undefined;
        const trade = await this.trades.update(id, accountId, {
            symbol: dto.symbol,
            side: dto.side,
            entry: dto.entry,
            exit: dto.exit,
            size: dto.size,
            r: dto.r,
            pnl,
            opened_at: dto.openedAt,
            closed_at: dto.closedAt,
        });
        if (!trade) {
            throw new NotFoundException('Trade not found');
        }
        return trade;
    }

    async remove(id: string, accountId: string, userId: string) {
        await this.verifyAccountOwnership(accountId, userId);
        const deleted = await this.trades.remove(id, accountId);
        if (!deleted) {
            throw new NotFoundException('Trade not found');
        }
    }

    // pnl only computable once both entry and exit are known.
    private computePnl(
        side: string | undefined,
        entry: number | undefined,
        exit: number | undefined,
        size: number | undefined,
    ): number | undefined {
        if (entry === undefined || exit === undefined || size === undefined) return undefined;
        const direction = side === 'SHORT' ? -1 : 1;
        // round to cents — money value, avoid binary-float drift into the NUMERIC column
        return Math.round((exit - entry) * size * direction * 100) / 100;
    }
}
