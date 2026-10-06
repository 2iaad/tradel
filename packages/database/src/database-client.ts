import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client';

// Keep the PostgreSQL adapter setup in one place for every server application.
export class DatabaseClient extends PrismaClient {
    constructor(connectionString: string) {
        const adapter = new PrismaPg({ connectionString });
        super({ adapter });
    }
}
