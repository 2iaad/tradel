import { Controller, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

// Create is trade-scoped: a note is always attached to a trade.
@ApiTags('notes')
@ApiCookieAuth('access_token')
@Controller('accounts/:accountId/trades/:tradeId/notes')
@UseGuards(JwtGuard)
export class NotesController {
    constructor(private readonly notesService: NotesService) {}

    @Post()
    @ApiOperation({ summary: 'Create a note for a trade' })
    create(
        @Param('accountId') accountId: string,
        @Param('tradeId') tradeId: string,
        @Body() createNoteDto: CreateNoteDto,
        @Req() req: Request,
    ) {
        return this.notesService.create(req.user.sub, accountId, tradeId, createNoteDto);
    }
}
