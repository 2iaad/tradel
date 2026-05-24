import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { validate } from './config/env.validation';

@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: '.env', // not necessary .env is already the default
            isGlobal: true, // no need to imports: [ConfigModule] in other modules
            validate, // nestjs calls it with process.env
        }),
        AuthModule,
        // TODO: add prisma module 
    ], // other modules this module depends on
})
export class AppModule {}
