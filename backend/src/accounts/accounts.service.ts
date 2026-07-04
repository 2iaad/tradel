import { Injectable } from '@nestjs/common';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class AccountsService {
    constructor(private readonly db: DatabaseService) {}

    async create(createAccountDto: CreateAccountDto) {
        // const result = await this.db.query('');
        return 'This action adds a new account';
    }

    findAll() {
        return `This action returns all accounts`;
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
