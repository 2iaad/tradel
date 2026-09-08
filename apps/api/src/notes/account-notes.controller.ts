import {
    Controller,
    Get,
    Patch,
    Delete,
    Body,
    Param,
    UseGuards,
    Req,
    HttpCode,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { NotesService } from './notes.service';
import { UpdateNoteDto } from './dto/update-note.dto';

// List / read / update / delete are account-scoped: notes are browsed
// account-wide, not per-trade. The owning trade is fixed at creation.
@Controller('accounts/:accountId/notes')
@UseGuards(JwtGuard)
export class AccountNotesController {
    constructor(private readonly notesService: NotesService) {}

    @Get()
    findAll(@Param('accountId') accountId: string, @Req() req: Request) {
        return this.notesService.findAll(req.user.sub, accountId);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @Param('accountId') accountId: string, @Req() req: Request) {
        return this.notesService.findOne(id, req.user.sub, accountId);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Param('accountId') accountId: string,
        @Body() updateNoteDto: UpdateNoteDto,
        @Req() req: Request,
    ) {
        return this.notesService.update(id, req.user.sub, accountId, updateNoteDto);
    }

    @Delete(':id')
    @HttpCode(204)
    remove(@Param('id') id: string, @Param('accountId') accountId: string, @Req() req: Request) {
        return this.notesService.remove(id, req.user.sub, accountId);
    }
}
