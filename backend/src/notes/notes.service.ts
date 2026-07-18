import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { AccountsRepository } from 'src/accounts/accounts.repository';
import { NotFoundError } from 'rxjs';
import { NotesRepository } from './notes.repository';

@Injectable()
export class NotesService {
    constructor(
        private readonly accounts: AccountsRepository,
        private readonly notes: NotesRepository,
    ) {}

    private async assertOwnedAccount(accountId: string, userId: string) {
        const account = await this.accounts.findOne(accountId, userId);
        if (!account) {
            throw new NotFoundException('Account not found');
        }
    }

    // TODO: fix this, continue tomorrow
    async create(accountId: string, userId: string, tradeId: string, createNoteDto: CreateNoteDto) {
        await this.assertOwnedAccount(accountId, userId);
        return this.notes.create(accountId, tradeId, createNoteDto);
    }

    findAll() {
        return `This action returns all notes`;
    }

    findOne(id: number) {
        return `This action returns a #${id} note`;
    }

    update(id: number, updateNoteDto: UpdateNoteDto) {
        return `This action updates a #${id} note`;
    }

    remove(id: number) {
        return `This action removes a #${id} note`;
    }
}
