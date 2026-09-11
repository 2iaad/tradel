import { Module } from '@nestjs/common';

import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import type { Env } from 'src/config/env.validation';

import { AuthController } from './auth.controller'; // controllers

import { AuthService } from './auth.service'; // providers
import { UsersRepository } from 'src/users/users.repository'; // providers
import { RefreshTokenRepository } from './refresh-token.repository';

@Module({
    imports: [
        ThrottlerModule.forRoot([
            {
                limit: 5, // number of requests
                ttl: 60_000, // 60s time is in milliseconds
                setHeaders: true, // add informative headers to request
                // blockDuration: 60_000, // -> default is 60s
            },
        ]),
        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService<Env>) => ({
                secret: config.get('jwtAccessSecret', { infer: true }),
                signOptions: {
                    expiresIn: config.get('jwtAccessTtl', { infer: true }),
                },
            }),
        }),
    ],

    controllers: [AuthController], // handles GET /users, POST /users, etc.
    providers: [AuthService, UsersRepository, RefreshTokenRepository], // business logic
})
export class AuthModule {}
