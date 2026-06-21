import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';
import { Env } from 'src/config/env.validation';
import { UsersRepository } from 'src/users/users.repository';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name); // checked only at compile-time

    constructor(
        private readonly users: UsersRepository,
        private readonly jwt: JwtService,
        private readonly config: ConfigService<Env>,
    ) {} // <Env> so infer knows the type

    async register(body: RegisterDto) {
        const passwordHash: string = await bcrypt.hash(body.password, 12);
        const user = await this.users.create(
            body.username,
            body.email,
            passwordHash,
        );
        this.logger.log(`Registered user: ${user.email}`);
        // TODO: return jwt
        return body;
    }

    async login(body: LoginDto) {
        const user = await this.users.findByEmail(body.email);
        if (
            !user ||
            (await bcrypt.compare(body.password, user.password_hash))
        ) {
            throw new UnauthorizedException('Invalide credentials');
        }

        // TODO: return jwt
        return body;
    }
}
