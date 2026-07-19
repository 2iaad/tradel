import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { AccountsRepository } from 'src/accounts/accounts.repository';
import { NotesRepository } from './notes.repository';
import { TradesRepository } from 'src/trades/trades.repository';

@Injectable()
export class NotesService {
    constructor(
        private readonly accounts: AccountsRepository,
        private readonly trades: TradesRepository,
        private readonly notes: NotesRepository,
    ) {}

    private async verifyAccountOwnership(accountId: string, userId: string) {
        const account = await this.accounts.findOne(accountId, userId);
        if (account === null) {
            throw new NotFoundException('Account not found');
        }
    }

    private async verifyTradeOwnership(tradeId: string, accountId: string) {
        const trade = await this.trades.findOne(tradeId, accountId);
        if (trade === null) {
            throw new NotFoundException('Trade not found');
        }
    }

    async create(userId: string, accountId: string, tradeId: string, createNoteDto: CreateNoteDto) {
        await this.verifyAccountOwnership(accountId, userId);
        await this.verifyTradeOwnership(tradeId, accountId);
        return this.notes.create(accountId, tradeId, createNoteDto);
    }

    async findOne(id: string, userId: string, accountId: string) {
        await this.verifyAccountOwnership(accountId, userId);
        const note = await this.notes.findOne(id, accountId);
        if (note === null) {
            throw new NotFoundException('Note not found');
        }
        return note;
    }

    async findAll(userId: string, accountId: string) {
        await this.verifyAccountOwnership(accountId, userId);
        return this.notes.findAllByAccount(accountId);
    }

    async update(id: string, userId: string, accountId: string, updateNoteDto: UpdateNoteDto) {
        await this.verifyAccountOwnership(accountId, userId);
        const note = await this.notes.update(id, accountId, updateNoteDto);
        if (note === null) {
            throw new NotFoundException('Note not found');
        }
        return note;
    }

    async remove(id: string, userId: string, accountId: string) {
        await this.verifyAccountOwnership(accountId, userId);
        const deleted = await this.notes.remove(id, accountId);
        if (!deleted) {
            throw new NotFoundException('Note not found');
        }
    }
}
