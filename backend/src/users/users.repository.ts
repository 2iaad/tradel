import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma, type users as User } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findByEmail(email: string): Promise<User | null> {
        return this.prisma.users.findUnique({ where: { email } });
    }

    async create(username: string, email: string, password_hash: string): Promise<User> {
        try {
            return await this.prisma.users.create({
                data: { username, email, password_hash },
            });
        } catch (error: unknown) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002'
            ) {
                throw new ConflictException('Username or email already in use');
            }

            throw error;
        }
    }
}
