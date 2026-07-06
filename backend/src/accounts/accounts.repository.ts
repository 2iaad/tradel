import { ConflictException, Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

export interface Account {
    id: string;
    user_id: string;
    name: string;
    broker: string | null;
    currency: string;
    created_at: Date;
}

@Injectable()
export class AccountsRepository {
    constructor(private readonly db: DatabaseService) {}

    async create(
        user_id: string,
        name: string,
        broker: string | null,
        currency: string,
    ): Promise<Account> {
        try {
            const { rows } = await this.db.query<Account>(
                `INSERT INTO accounts (user_id, name, broker, currency)
                VALUES ($1, $2, $3, $4)
                RETURNING id, user_id, name, broker, currency, created_at`,
                [user_id, name, broker, currency],
            );
            return rows[0];
        } catch (e: any) {
            if (e.code === '23505')
                throw new ConflictException('An account with this name already exists');
            throw e;
        }
    }

    async findAccountsOfUserId(user_id: string): Promise<Account[]> {
        const { rows } = await this.db.query<Account>(`SELECT * FROM accounts WHERE user_id = $1`, [
            user_id,
        ]);
        return rows;
    }

    async findOne(id: string, user_id: string): Promise<Account | null> {
        const { rows } = await this.db.query<Account>(
            `SELECT * FROM accounts WHERE id = $1 AND user_id = $2`,
            [id, user_id],
        );
        return rows[0] ?? null;
    }

    async update(
        id: string,
        user_id: string,
        fields: { name?: string; broker?: string | null; currency?: string },
    ): Promise<Account | null> {
        const brokerProvided = fields.broker !== undefined;

        try {
            const { rows } = await this.db.query<Account>(
                `UPDATE accounts
                SET name     = COALESCE($1, name),
                    currency = COALESCE($2, currency),
                    broker   = CASE WHEN $3 THEN $4 ELSE broker END
                WHERE id = $5 AND user_id = $6
                RETURNING id, user_id, name, broker, currency, created_at`,
                [
                    fields.name ?? null,
                    fields.currency ?? null,
                    brokerProvided,
                    fields.broker ?? null,
                    id,
                    user_id,
                ],
            );
            return rows[0] ?? null;
        } catch (e: any) {
            if (e.code === '23505')
                throw new ConflictException('An account with this name already exists');
            throw e;
        }
    }

    async remove(id: string, user_id: string): Promise<boolean> {
        const { rowCount } = await this.db.query(
            `DELETE FROM accounts WHERE id = $1 AND user_id = $2`,
            [id, user_id],
        );
        return rowCount !== null && rowCount > 0;
    }
}
