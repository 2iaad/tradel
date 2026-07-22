import {
    Injectable,
    Logger,
    OnModuleDestroy,
    OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from 'src/config/env.validation';
import { Pool, QueryResult, QueryResultRow } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(DatabaseService.name);
    private pool!: Pool;

    constructor(private readonly config: ConfigService<Env>) {}

    async onModuleInit() {
        // Prod (Neon/managed): single DB_URL + SSL. Dev: discrete DB_* vars.
        const isProd = this.config.get('NODE_ENV', { infer: true }) === 'production';
        this.pool = isProd
            ? new Pool({
                  connectionString: this.config.get('DB_URL', { infer: true }),
                  ssl: { rejectUnauthorized: false },
              })
            : new Pool({
                  host: this.config.get('DB_HOST', { infer: true }),
                  port: this.config.get('DB_PORT', { infer: true }),
                  user: this.config.get('DB_USER', { infer: true }),
                  password: this.config.get('DB_PASSWORD', { infer: true }),
                  database: this.config.get('DB_NAME', { infer: true }),
              });

        this.pool.on('error', (err) => {
            this.logger.error('Unexpected POSTGRES poot error', err);
        });

        await this.pool.query('SELECT 1');
        this.logger.log('-> Database query test succeeded');
    }

    async onModuleDestroy() {
        await this.pool.end();
    }

    async query<T extends QueryResultRow>(
        sql: string,
        params?: unknown[],
    ): Promise<QueryResult<T>> {
        return this.pool.query<T>(sql, params);
    }
}
