import { Injectable } from '@nestjs/common';
import type { refresh_tokens as RefreshToken } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

export type { RefreshToken };

@Injectable()
export class RefreshTokenRepository {
    constructor(private readonly prisma: PrismaService) {}

    async create(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
        await this.prisma.refresh_tokens.create({
            data: {
                user_id: userId,
                token_hash: tokenHash,
                expires_at: expiresAt,
            },
        });
    }

    /** Look up by the token's sha256 hash and flatten the owning user's email. */
    async findByHash(tokenHash: string): Promise<(RefreshToken & { email: string }) | null> {
        const token = await this.prisma.refresh_tokens.findFirst({
            where: { token_hash: tokenHash },
            include: {
                users: {
                    select: { email: true },
                },
            },
        });

        if (!token) return null;

        const { users, ...refreshToken } = token;
        return { ...refreshToken, email: users.email };
    }

    async revokeByHash(tokenHash: string): Promise<void> {
        await this.prisma.refresh_tokens.updateMany({
            where: {
                token_hash: tokenHash,
                revoked_at: null,
            },
            data: { revoked_at: new Date() },
        });
    }

    async revokeAllForUser(userId: string): Promise<void> {
        await this.prisma.refresh_tokens.updateMany({
            where: {
                user_id: userId,
                revoked_at: null,
            },
            data: { revoked_at: new Date() },
        });
    }
}
