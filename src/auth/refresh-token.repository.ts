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

    async create(userId: string, tokenHash: string, expiresAt: Date): Promise<string> {
        const { rows } = await this.db.query<{ id: string }>(
            `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
             VALUES ($1, $2, $3)
             RETURNING id`,
            [userId, tokenHash, expiresAt],
        );
        return rows[0].id; // this id becomes the token's "jti"
    }

    async updateHash(id: string, tokenHash: string): Promise<void> {
        await this.db.query(`UPDATE refresh_tokens SET token_hash = $1 WHERE id = $2`, [
            tokenHash,
            id,
        ]);
    }

    async findById(id: string): Promise<RefreshToken | null> {
        const { rows } = await this.db.query<RefreshToken>(
            `SELECT * FROM refresh_tokens WHERE id = $1`,
            [id],
        );
        return rows[0] ?? null;
    }

    async revoke(id: string): Promise<void> {
        await this.db.query(
            `UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1 AND revoked_at IS NULL`,
            [id],
        );
    }

    async revokeAllForUser(userId: string): Promise<void> {
        await this.db.query(
            `UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL`,
            [userId],
        );
    }
}
