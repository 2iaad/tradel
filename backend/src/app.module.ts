import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { validate } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { AccountsModule } from './accounts/accounts.module';
import { TradesModule } from './trades/trades.module';
import { NotesModule } from './notes/notes.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: '.env', // not necessary .env is already the default
            isGlobal: true, // no need to imports: [ConfigModule] in other modules
            validate, // nestjs call this func with process.env
        }),
        AuthModule,
        DatabaseModule,
        AccountsModule,
        TradesModule,
        NotesModule,
        AnalyticsModule,
    ], // other modules this module depends on
})
export class AppModule {}
