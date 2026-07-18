import { Module } from '@nestjs/common';
import { NotesService } from './notes.service';
import { NotesController } from './notes.controller';
import { DatabaseService } from 'src/database/database.service';
import { NotesRepository } from './notes.repository';
import { AccountsRepository } from 'src/accounts/accounts.repository';

@Module({
    controllers: [NotesController],
    providers: [NotesService, NotesRepository, AccountsRepository, DatabaseService],
})
export class NotesModule {}
