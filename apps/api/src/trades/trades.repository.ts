import { Injectable } from '@nestjs/common';
import { Prisma, type trades as Trade } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

export type { Trade };

export interface CreateTradeFields {
    symbol: string;
    side: string;
    entry: number;
    exit?: number | null;
    lots: number;
    risk_reward?: number | null;
    pnl?: Prisma.Decimal | null;
    created_at?: Date;
}

export interface UpdateTradeFields {
    symbol?: string;
    side?: string;
    entry?: number;
    exit?: number | null;
    lots?: number;
    risk_reward?: number | null;
    pnl?: Prisma.Decimal | null;
    created_at?: Date;
}

@Injectable()
export class TradesRepository {
    constructor(private readonly prisma: PrismaService) {}

    async create(account_id: string, fields: CreateTradeFields): Promise<Trade> {
        return this.prisma.trades.create({
            data: {
                account_id,
                symbol: fields.symbol,
                side: fields.side,
                entry: fields.entry,
                exit: fields.exit ?? null,
                lots: fields.lots,
                risk_reward: fields.risk_reward ?? null,
                pnl: fields.pnl ?? null,
                created_at: fields.created_at,
            },
        });
    }

    async findOne(id: string, account_id: string): Promise<Trade | null> {
        return this.prisma.trades.findFirst({ where: { id, account_id } });
    }

    async findAllByAccount(account_id: string): Promise<Trade[]> {
        return this.prisma.trades.findMany({
            where: { account_id },
            orderBy: { created_at: 'desc' },
        });
    }

    async update(id: string, account_id: string, fields: UpdateTradeFields): Promise<Trade | null> {
        if (Object.values(fields).every((value) => value === undefined)) {
            return this.findOne(id, account_id);
        }

        try {
            return await this.prisma.trades.update({
                where: { id, account_id },
                data: fields,
            });
        } catch (error: unknown) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                return null;
            }
            throw error;
        }
    }

    async remove(id: string, account_id: string): Promise<boolean> {
        const { count } = await this.prisma.trades.deleteMany({ where: { id, account_id } });
        return count > 0;
    }
}
