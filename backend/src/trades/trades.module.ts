import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Env } from 'src/config/env.validation';

import { AccountsModule } from 'src/accounts/accounts.module';
import { TradesService } from './trades.service';
import { TradesController } from './trades.controller';
import { TradesRepository } from './trades.repository';

@Module({
    // JwtModule so JwtGuard can inject JwtService here (same config as AuthModule).
    // AccountsModule exports AccountsRepository for the ownership check.
    imports: [
        AccountsModule,
        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService<Env>) => ({
                secret: config.get('JWT_ACCESS_SECRET', { infer: true }),
                signOptions: {
                    expiresIn: config.get('JWT_ACCESS_TTL', { infer: true }),
                },
            }),
        }),
    ],
    controllers: [TradesController],
    providers: [TradesService, TradesRepository],
    exports: [TradesRepository],
})
export class TradesModule {}
