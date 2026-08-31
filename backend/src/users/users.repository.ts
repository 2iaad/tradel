import { ConflictException, Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import type { users as User } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersRepository {
    constructor(
        private readonly db: DatabaseService,
        private readonly prisma: PrismaService,
    ) {}

    async findByEmail(email: string): Promise<User | null> {
        return this.prisma.users.findUnique({ where: { email } });
    }

    async create(username: string, email: string, password_hash: string): Promise<User> {
        try {
            const { rows } = await this.db.query<User>( // sending 3 recieving 5
                `INSERT INTO users (username, email, password_hash)
                VALUES ($1, $2, $3)
                RETURNING id, username, email, created_at, password_hash`,
                [username, email, password_hash],
            );
            return rows[0];
        } catch (e: any) {
            if (e.code === '23505')
                // because we are using UNIQUE in the sql table
                throw new ConflictException('Username or email already in use');
            throw e;
        }
    } // returns user
}
