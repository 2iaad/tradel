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
        // Build the SET clause only from the fields that were actually passed,
        // so PATCH with a partial body doesn't overwrite columns with undefined.
        const columns: string[] = [];
        const values: unknown[] = [];
        let i = 1;

        for (const key of ['name', 'broker', 'currency'] as const) {
            if (fields[key] !== undefined) {
                columns.push(`${key} = $${i}`);
                values.push(fields[key]);
                i++;
            }
        }

        // Nothing to update: just return the current row (still owner-scoped).
        if (columns.length === 0) {
            return this.findOne(id, user_id);
        }

        values.push(id, user_id);

        try {
            const { rows } = await this.db.query<Account>(
                `UPDATE accounts SET ${columns.join(', ')}
                WHERE id = $${i} AND user_id = $${i + 1}
                RETURNING id, user_id, name, broker, currency, created_at`,
                values,
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
