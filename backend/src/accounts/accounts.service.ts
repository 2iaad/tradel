import { Injectable, NotFoundException } from '@nestjs/common';
import { AccountsRepository } from './accounts.repository';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountsService {
    constructor(private readonly accounts: AccountsRepository) {}

    async create(userId: string, dto: CreateAccountDto) {
        return this.accounts.create(userId, dto.name, dto.broker ?? null, dto.currency ?? 'USD');
    }

    async findAll(userId: string) {
        return this.accounts.findAccountsOfUserId(userId);
    }

    async findOne(id: string, userId: string) {
        const account = await this.accounts.findOne(id, userId);
        if (!account) {
            throw new NotFoundException('Account not found');
        }
        return account;
    }

    async update(id: string, userId: string, dto: UpdateAccountDto) {
        const account = await this.accounts.update(id, userId, dto);
        if (!account) {
            throw new NotFoundException('Account not found');
        }
        return account;
    }

    async remove(id: string, userId: string) {
        const deleted = await this.accounts.remove(id, userId);
        if (!deleted) {
            throw new NotFoundException('Account not found');
        }
    }
}
