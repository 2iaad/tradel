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

    async create(user_id: string, name: string, currency: string): Promise<Account> {
        try {
            const { rows } = await this.db.query<Account>(
                `INSERT INTO accounts (user_id, name, currency)
                VALUES ($1, $2, $3)
                RETURNING id, user_id, name, broker, currency, created_at`,
                [user_id, name, currency],
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
}
