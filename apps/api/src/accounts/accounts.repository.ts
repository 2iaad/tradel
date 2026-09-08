import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma, type accounts as Account } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

export type { Account };

export interface UpdateAccountFields {
    name?: string;
    broker?: string | null;
    currency?: string;
    starting_balance?: number;
}

@Injectable()
export class AccountsRepository {
    constructor(private readonly prisma: PrismaService) {}

    async create(
        user_id: string,
        name: string,
        broker: string | null,
        currency: string,
        starting_balance: number,
    ): Promise<Account> {
        try {
            return await this.prisma.accounts.create({
                data: { user_id, name, broker, currency, starting_balance },
            });
        } catch (error: unknown) {
            this.handleUniqueConstraint(error);
        }
    }

    async findAccountsOfUserId(user_id: string): Promise<Account[]> {
        return this.prisma.accounts.findMany({ where: { user_id } });
    }

    async findOne(id: string, user_id: string): Promise<Account | null> {
        return this.prisma.accounts.findFirst({ where: { id, user_id } });
    }

    async update(
        id: string,
        user_id: string,
        fields: UpdateAccountFields,
    ): Promise<Account | null> {
        if (Object.values(fields).every((value) => value === undefined)) {
            return this.findOne(id, user_id);
        }

        try {
            return await this.prisma.accounts.update({
                where: { id, user_id },
                data: fields,
            });
        } catch (error: unknown) {
            if (this.isKnownError(error, 'P2025')) return null;
            this.handleUniqueConstraint(error);
        }
    }

    async remove(id: string, user_id: string): Promise<boolean> {
        const { count } = await this.prisma.accounts.deleteMany({ where: { id, user_id } });
        return count > 0;
    }

    private handleUniqueConstraint(error: unknown): never {
        if (this.isKnownError(error, 'P2002')) {
            throw new ConflictException('An account with this name already exists');
        }
        throw error;
    }

    private isKnownError(error: unknown, code: string): boolean {
        return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
    }
}
