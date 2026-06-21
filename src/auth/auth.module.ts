import { Module } from '@nestjs/common';

import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Env } from 'src/config/env.validation';

import { AuthController } from './auth.controller'; // controllers

import { AuthService } from './auth.service'; // providers
import { UsersRepository } from 'src/users/users.repository'; // providers

@Module({
    imports: [
        JwtModule.registerAsync({
            // TODO: understand more this part
            inject: [ConfigService],
            useFactory: (config: ConfigService<Env>) => ({
                secret: config.get('JWT_ACCESS_SECRET', { infer: true }),
                signOptions: {
                    expiresIn: config.get('JWT_ACCESS_TTL', { infer: true }),
                },
            }),
        }),
    ],

    controllers: [AuthController], // handles GET /users, POST /users, etc.
    providers: [AuthService, UsersRepository], // business logic
})
export class AuthModule {}
