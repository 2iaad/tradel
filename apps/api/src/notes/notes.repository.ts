import { Injectable } from '@nestjs/common';
import { Prisma, type notes as Note } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

export type { Note };

export interface CreateNoteFields {
    title: string;
    body: string;
    tags?: string[];
}

export interface UpdateNoteFields {
    title?: string;
    body?: string;
    tags?: string[];
}

@Injectable()
export class NotesRepository {
    constructor(private readonly prisma: PrismaService) {}

    async create(account_id: string, trade_id: string, fields: CreateNoteFields): Promise<Note> {
        return this.prisma.notes.create({
            data: {
                account_id,
                trade_id,
                title: fields.title,
                body: fields.body,
                tags: fields.tags ?? [],
            },
        });
    }

    async findOne(id: string, account_id: string): Promise<Note | null> {
        return this.prisma.notes.findFirst({ where: { id, account_id } });
    }

    async findAllByAccount(account_id: string): Promise<Note[]> {
        return this.prisma.notes.findMany({
            where: { account_id },
            orderBy: { created_at: 'desc' },
        });
    }

    async update(id: string, account_id: string, fields: UpdateNoteFields): Promise<Note | null> {
        if (Object.values(fields).every((value) => value === undefined)) {
            return this.findOne(id, account_id);
        }

        try {
            return await this.prisma.notes.update({
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
        const { count } = await this.prisma.notes.deleteMany({ where: { id, account_id } });
        return count > 0;
    }
}
