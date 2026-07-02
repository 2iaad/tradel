import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

export interface RefreshToken {
    id: string;
    user_id: string;
    token_hash: string;
    expires_at: Date;
    revoked_at: Date | null;
    created_at: Date;
}

@Injectable()
export class RefreshTokenRepository {
    constructor(private readonly db: DatabaseService) {}

    async create(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
        await this.db.query(
            `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
             VALUES ($1, $2, $3)`,
            [userId, tokenHash, expiresAt],
        );
    }

    /** Look up by the token's sha256 hash, joining the user's email for the new access token. */
    async findByHash(tokenHash: string): Promise<(RefreshToken & { email: string }) | null> {
        const { rows } = await this.db.query<RefreshToken & { email: string }>(
            `SELECT rt.*, u.email
             FROM refresh_tokens rt
             JOIN users u ON u.id = rt.user_id
             WHERE rt.token_hash = $1`,
            [tokenHash],
        );
        return rows[0] ?? null;
    }

    async revokeByHash(tokenHash: string): Promise<void> {
        await this.db.query(
            `UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1 AND revoked_at IS NULL`,
            [tokenHash],
        );
    }

    async revokeAllForUser(userId: string): Promise<void> {
        // log the user out from all devices
        await this.db.query(
            `UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL`,
            [userId],
        );
    }
}
