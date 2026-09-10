import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from 'src/generated/prisma/client';
import type { Env } from 'src/config/env.validation';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name);

    constructor(config: ConfigService<Env>) {
        const connectionString = config.get('dbUrl', { infer: true });
        const adapter = new PrismaPg({ connectionString });

        super({ adapter });
    }

    async onModuleInit() {
        await this.$connect();
        try {
            await this.$queryRaw`SELECT 1`; // try first query check health
            this.logger.log('Database connected successfully');
        } catch (error: any) {
            this.logger.error(`❌ Database connection failed: ${error.code || error.message}`);
            this.logger.error(
                '👉 Make sure PostgreSQL is up and your DB_URL credentials are correct.',
            );

            // process.exit(1);
        }
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}
