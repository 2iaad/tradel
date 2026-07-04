import { Injectable } from '@nestjs/common';
import { AccountsRepository } from './accounts.repository';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountsService {
    constructor(private readonly accounts: AccountsRepository) {}

    async create(userId: string, dto: CreateAccountDto) {
        return this.accounts.create(userId, dto.name, dto.currency ?? 'USD');
    }

    async findAll(userId: string) {
        return this.accounts.findAccountsOfUserId(userId);
    }

    findOne(id: number) {
        return `This action returns a #${id} account`;
    }

    update(id: number, updateAccountDto: UpdateAccountDto) {
        return `This action updates a #${id} account`;
    }

    remove(id: number) {
        return `This action removes a #${id} account`;
    }
}
