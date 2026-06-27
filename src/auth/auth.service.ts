import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersRepository } from 'src/users/users.repository';
import { Env } from 'src/config/env.validation';
import * as bcrypt from 'bcrypt';
import { RefreshTokenRepository } from './refresh-token.repository';
import { createHash } from 'crypto';

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
        let payload: { sub: string; email: string; jti: string };

        try {
            payload = this.jwt.verify(rawRefreshToken, {
                secret: this.config.get('JWT_REFRESH_SECRET', { infer: true }),
            }); // checks signature + exp
        } catch {
            throw new UnauthorizedException('Invalid refresh token');
        }

        // reject if missing, revoked, or the stored hash doesn't match
        const stored = await this.refreshTokens.findById(payload.jti);
        if (!stored || stored.revoked_at || this.hash(rawRefreshToken) !== stored.token_hash) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        // Static refresh token: only issue a new access token, refresh token stays the same
        const accessToken = this.jwt.sign({
            sub: stored.user_id,
            email: payload.email,
        });
        return { accessToken };
    }

    async logout(rawRefreshToken: string | undefined) {
        if (!rawRefreshToken) return;

        try {
            const { jti } = this.jwt.verify<{ jti: string }>(rawRefreshToken, {
                secret: this.config.get('JWT_REFRESH_SECRET', { infer: true }),
            });
            await this.refreshTokens.revoke(jti);
        } catch {
            /** */
        }
    }

    // --- helpers ---

    /** Mint an access token + a NEW refresh token, persisting the refresh token's hash. */
    private async issueTokens(userId: string, email: string) {
        const accessToken = this.jwt.sign({ sub: userId, email }); // module defaults = access secret + TTL

        const REFRESH_TTL_MS: string | undefined = this.config.get('JWT_REFRESH_TTL', {
            infer: true,
        });
        const expiresAt = new Date(Date.now() + REFRESH_TTL_MS!);
        const jti = await this.refreshTokens.create(userId, 'pending', expiresAt);

        const refreshToken = this.jwt.sign(
            { sub: userId, email, jti },
            {
                secret: this.config.get('JWT_REFRESH_SECRET', { infer: true }),
                expiresIn: this.config.get('JWT_REFRESH_TTL', { infer: true }),
            },
        );
        await this.refreshTokens.updateHash(jti, this.hash(refreshToken)); // store hash to verify on refresh
        return { accessToken, refreshToken };
    }

    private hash(token: string): string {
        return createHash('sha256').update(token).digest('hex');
    }
}
