import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseClient } from '@tradel/database';
import type { Env } from 'src/config/env.validation';

@Injectable()
export class PrismaService extends DatabaseClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name);

    constructor(config: ConfigService<Env>) {
        const connectionString = config.get('dbUrl', { infer: true });

        if (!connectionString) {
            throw new Error('DB_URL or DATABASE_URL is required');
        }

        super(connectionString);
    }

    async onModuleInit() {
        await this.$connect();
        try {
            await this.$queryRaw`SELECT 1`; // try first query check health
            this.logger.log('✅️ Database connected successfully');
        } catch (error: any) {
            this.logger.error(`❌ Database connection failed: ${error.code || error.message}`);
            this.logger.error('👉 Make sure PostgreSQL is up and your DB_URL credentials.');

            // process.exit(1);
        }
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}
