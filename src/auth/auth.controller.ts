import { Controller, Post, Body, Res, HttpCode, Req } from '@nestjs/common';
import type { Request, Response } from 'express';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { Env } from 'src/config/env.validation';
import ms, { StringValue } from 'ms';

const REFRESH_COOKIE: string = 'refresh_token';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService<Env>,
    ) {}

    @Post('register')
    async register(@Body() body: RegisterDto, @Res({ passthrough: true }) res: Response) {
        const { accessToken, refreshToken } = await this.authService.register(body);
        return this.authService.register(body);
    }

    @Post('login')
    @HttpCode(200)
    async login(@Body() body: LoginDto, @Res({ passthrough: true }) res: Response) {
        const { accessToken, refreshToken } = await this.authService.login(body);

        return this.authService.login(body);
    }

    @Post('refresh')
    @HttpCode(200)
    async refresh(@Req() req: Request) {
        const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
        if (!token) return { accessToken: null };
        const { accessToken } = await this.authService.refresh(token);
        return { accessToken };
    }

    @Post('logout')
    @HttpCode(204)
    async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        await this.authService.logout(req.cookies?.[REFRESH_COOKIE] as string | undefined);
        res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
    }

    private setRefreshCookie(res: Response, token: string) {
        res.cookie(REFRESH_COOKIE, token, {
            httpOnly: true, // JS can't read it → XSS-safe
            secure: process.env.NODE_ENV === 'production', // HTTPS only in prod; off for localhost http
            sameSite: 'strict', // not sent on cross-site requests → CSRF-safe
            path: '/api/auth', // only sent to the auth routes that need it
            maxAge: ms(this.configService.get('JWT_REFRESH_TTL', { infer: true }) as StringValue), // 7d, matches the refresh token's life
        });
    }
}
