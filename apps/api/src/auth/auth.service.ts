import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersRepository } from 'src/users/users.repository';
import { Env } from 'src/config/env.validation';
import * as bcrypt from 'bcrypt';
import { RefreshTokenRepository } from './refresh-token.repository';
import { createHash, randomBytes } from 'crypto';
import ms, { StringValue } from 'ms';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name); // checked only at compile-time

    constructor(
        private readonly users: UsersRepository,
        private readonly refreshTokens: RefreshTokenRepository,
        private readonly jwt: JwtService,
        private readonly config: ConfigService<Env>,
    ) {} // <Env> so infer knows the type

    async register(body: RegisterDto) {
        const passwordHash: string = await bcrypt.hash(body.password, 12);
        const user = await this.users.create(body.username, body.email, passwordHash);

        this.logger.log(`Registered user: ${user.email}`);
        return this.issueTokens(user.id, user.email);
    }

    async login(body: LoginDto) {
        const user = await this.users.findByEmail(body.email);
        if (!user || !(await bcrypt.compare(body.password, user.password_hash))) {
            throw new UnauthorizedException('Invalide credentials');
        }

        return this.issueTokens(user.id, user.email);
    }

    async refresh(rawRefreshToken: string) {
        // Opaque token: look it up by hash, reject if missing / revoked / expired
        const stored = await this.refreshTokens.findByHash(this.hash(rawRefreshToken));
        if (!stored || stored.revoked_at || stored.expires_at.getTime() < Date.now()) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        // Static refresh token: only issue a new access token, refresh token stays the same
        const accessToken = this.jwt.sign({ sub: stored.user_id, email: stored.email });
        return { accessToken };
    }

    async logout(rawRefreshToken: string | undefined) {
        if (!rawRefreshToken) return;
        await this.refreshTokens.revokeByHash(this.hash(rawRefreshToken));
    }

    // --- helpers ---

    /** Mint an access token (JWT) + an opaque refresh token, persisting only the refresh token's hash. */
    private async issueTokens(userId: string, email: string) {
        const accessToken = this.jwt.sign({ sub: userId, email }); // gets (access secret + TTL) from auth.module.ts

        const refreshToken = randomBytes(32).toString('hex'); // random string, not a JWT
        const refreshTtl = this.config.get('JWT_REFRESH_TTL', { infer: true }) as StringValue;
        const expiresAt = new Date(Date.now() + ms(refreshTtl));
        await this.refreshTokens.create(userId, this.hash(refreshToken), expiresAt); // store (userId, hashed refreshTOken, expiry time)

        return { accessToken, refreshToken };
    }

    private hash(token: string): string {
        return createHash('sha256').update(token).digest('hex');
    }
}
