import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class EmailVerificationRepository {
    constructor(private readonly prisma: PrismaService) {}

    /**
     * Creates the user's first verification token or replaces their old token.
     *
     * Flow:
     * -> First request: create a token with its hash and expiration time.
     * -> Resend request: replace the existing hash, expiration, and creation time.
     * -> Result: the user has only one active verification token.
     */
    async createOrReplaceToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
        await this.prisma.email_verification_tokens.upsert({
            where: { user_id: userId },
            create: {
                user_id: userId,
                token_hash: tokenHash,
                expires_at: expiresAt,
            },
            update: {
                token_hash: tokenHash,
                expires_at: expiresAt,
                created_at: new Date(),
            },
        });
    }

    /**
     * Uses a valid token once and marks its user's email as verified.
     *
     * Flow:
     * -> Find the token by its hash.
     * -> Missing token: return null.
     * -> Expired token: delete it, then return null.
     * -> Valid token: delete it so it cannot be used again.
     * -> Mark the user's email as verified with the current time.
     * -> Transaction failure: undo every database change.
     */
    async verifyTokenAndMarkEmailVerified(tokenHash: string) {
        return this.prisma.$transaction(async (tx) => {
            const now = new Date();
            const token = await tx.email_verification_tokens.findUnique({
                where: { token_hash: tokenHash },
            });

            if (!token || token.expires_at <= now) {
                if (token) {
                    await tx.email_verification_tokens.delete({
                        where: { id: token.id },
                    });
                }
                return null;
            }

            const deleted = await tx.email_verification_tokens.deleteMany({
                where: {
                    id: token.id,
                    token_hash: tokenHash,
                    expires_at: { gt: now },
                },
            });

            if (deleted.count !== 1) return null;

            return tx.users.update({
                where: { id: token.user_id },
                data: { email_verified_at: now },
            });
        });
    }
}
