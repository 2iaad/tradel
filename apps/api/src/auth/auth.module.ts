import { Module } from '@nestjs/common';

import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Env } from 'src/config/env.validation';

import { AuthController } from './auth.controller'; // controllers

import { AuthService } from './auth.service'; // providers
import { UsersRepository } from 'src/users/users.repository'; // providers
import { RefreshTokenRepository } from './refresh-token.repository';

@Module({
    imports: [
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
