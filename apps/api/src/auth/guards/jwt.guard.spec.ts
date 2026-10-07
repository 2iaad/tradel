import { Controller, Get, INestApplication, Req } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import type { Request } from 'express';
import request from 'supertest';
import { AuthModule } from '../auth.module';
import { AuthService } from '../auth.service';
import { EmailService } from '../email.service';
import { EmailVerificationRepository } from '../email-verification.repository';
import { RefreshTokenRepository } from '../refresh-token.repository';
import { UsersRepository } from '../../users/users.repository';

// No local guard: importing AuthModule must protect new controllers too.
@Controller('guard-test')
class ProtectedController {
    @Get()
    profile(@Req() req: Request) {
        return req.user;
    }
}

describe('Global JWT authentication', () => {
    let app: INestApplication;
    let jwt: JwtService;
    const user = { id: 'test-user', email: 'test@example.com' };
    const tokens = { accessToken: 'access-token', refreshToken: 'refresh-token' };
    const authService = {
        login: jest.fn().mockResolvedValue({ user, tokens }),
        loginWithGoogle: jest.fn().mockResolvedValue({ user, tokens }),
        register: jest.fn().mockResolvedValue({ verificationRequired: true }),
        verifyEmail: jest.fn().mockResolvedValue({ verified: true }),
        resendVerification: jest.fn().mockResolvedValue(undefined),
        refresh: jest.fn().mockResolvedValue({ accessToken: tokens.accessToken }),
        logout: jest.fn().mockResolvedValue(undefined),
    };

    beforeAll(async () => {
        const builder = Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({
                    isGlobal: true,
                    ignoreEnvFile: true,
                    skipProcessEnv: true,
                    load: [
                        () => ({
                            nodeEnv: 'test',
                            jwtAccessSecret: 'test-secret-only-for-global-guard-tests',
                            jwtAccessTtl: '900s',
                            jwtRefreshTtl: '7d',
                        }),
                    ],
                }),
                AuthModule,
            ],
            controllers: [ProtectedController],
        })
            .overrideProvider(AuthService)
            .useValue(authService);

        // These dependencies are not involved in guard behavior.
        for (const provider of [
            UsersRepository,
            RefreshTokenRepository,
            EmailVerificationRepository,
            EmailService,
        ]) {
            builder.overrideProvider(provider).useValue({});
        }

        const module = await builder.compile();
        jwt = module.get(JwtService);
        app = module.createNestApplication();
        app.use(cookieParser());
        app.setGlobalPrefix('api');
        await app.init();
    });

    afterAll(async () => {
        await app?.close();
    });

    it.each(['/api/guard-test', '/api/auth/me'])(
        'rejects an anonymous request to %s',
        async (path) => {
            await request(app.getHttpServer()).get(path).expect(401);
        },
    );

    it('attaches the verified user on a controller without a local guard', async () => {
        const token = jwt.sign({ sub: user.id, email: user.email });
        const response = await request(app.getHttpServer())
            .get('/api/guard-test')
            .set('Cookie', `access_token=${token}`)
            .expect(200);
        expect(response.body).toMatchObject({ sub: user.id, email: user.email });
    });

    it('keeps the current-user endpoint protected and working', async () => {
        const token = jwt.sign({ sub: user.id, email: user.email });
        await request(app.getHttpServer())
            .get('/api/auth/me')
            .set('Cookie', `access_token=${token}`)
            .expect(200, user);
    });

    it('rejects an expired access token', async () => {
        const token = jwt.sign({ sub: user.id }, { expiresIn: -1 });
        await request(app.getHttpServer())
            .get('/api/guard-test')
            .set('Cookie', `access_token=${token}`)
            .expect(401);
    });

    it('rejects a token signed with another secret', async () => {
        const token = jwt.sign({ sub: user.id }, { secret: 'wrong-secret' });
        await request(app.getHttpServer())
            .get('/api/guard-test')
            .set('Cookie', `access_token=${token}`)
            .expect(401);
    });

    it.each([
        ['login', 200],
        ['google', 200],
        ['register', 201],
        ['verify-email', 200],
        ['resend-verification', 204],
        ['refresh', 204],
        ['logout', 204],
    ])('allows public endpoint %s even with an invalid access cookie', async (path, status) => {
        await request(app.getHttpServer())
            .post(`/api/auth/${path}`)
            .set('Cookie', ['access_token=invalid', 'refresh_token=test-refresh'])
            .send({ email: user.email, token: 'verification-token', credential: 'google-token' })
            .expect(status as number);
    });

    it('still requires a refresh cookie on the public refresh endpoint', async () => {
        await request(app.getHttpServer()).post('/api/auth/refresh').expect(401);
    });

    it('passes the refresh cookie to the existing refresh and logout handlers', async () => {
        authService.refresh.mockClear();
        authService.logout.mockClear();
        for (const path of ['refresh', 'logout']) {
            await request(app.getHttpServer())
                .post(`/api/auth/${path}`)
                .set('Cookie', 'refresh_token=test-refresh')
                .expect(204);
        }
        expect(authService.refresh).toHaveBeenCalledWith('test-refresh');
        expect(authService.logout).toHaveBeenCalledWith('test-refresh');
    });

    it('still rate-limits public login requests', async () => {
        for (let attempt = 0; attempt < 5; attempt++) {
            await request(app.getHttpServer()).post('/api/auth/login').send({});
        }
        await request(app.getHttpServer()).post('/api/auth/login').send({}).expect(429);
    });
});
