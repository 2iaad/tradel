import { Injectable, NotFoundException } from '@nestjs/common';
import { AccountsRepository } from 'src/accounts/accounts.repository';
import { Prisma } from 'src/generated/prisma/client';
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
        return this.trades.create(accountId, {
            symbol: dto.symbol,
            side: dto.side,
            entry: dto.entry,
            exit: dto.exit,
            lots: dto.lots,
            pnl: this.computePnl(dto.side, dto.entry, dto.exit ?? null, dto.lots),
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
        const current = await this.trades.findOne(id, accountId);
        if (!current) {
            throw new NotFoundException('Trade not found');
        }

        const changesPnlInput =
            dto.side !== undefined ||
            dto.entry !== undefined ||
            dto.exit !== undefined ||
            dto.lots !== undefined;
        const pnl = changesPnlInput
            ? this.computePnl(
                  dto.side ?? current.side,
                  dto.entry ?? current.entry,
                  dto.exit ?? current.exit,
                  dto.lots ?? current.lots,
              )
            : undefined;
        const trade = await this.trades.update(id, accountId, {
            symbol: dto.symbol,
            side: dto.side,
            entry: dto.entry,
            exit: dto.exit,
            lots: dto.lots,
            risk_reward: dto.rReward,
            pnl,
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

    private computePnl(
        side: string,
        entry: Prisma.Decimal | number,
        exit: Prisma.Decimal | number | null,
        lots: Prisma.Decimal | number,
    ): Prisma.Decimal | null {
        if (exit === null) return null;

        const direction = side === 'SHORT' ? -1 : 1;
        return new Prisma.Decimal(exit)
            .minus(entry)
            .times(lots)
            .times(direction)
            .toDecimalPlaces(2);
    }
}
