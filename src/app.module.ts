import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { validate } from './config/env.validation';
import { DatabaseModule } from './database/database.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: '.env', // not necessary .env is already the default
            isGlobal: true, // no need to imports: [ConfigModule] in other modules
            validate, // nestjs call this func with process.env
        }),
        AuthModule,
        DatabaseModule,
        // TODO: add prisma module
    ], // other modules this module depends on
})
export class AppModule {}
