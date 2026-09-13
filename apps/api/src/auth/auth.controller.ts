import { Controller, Post, Body, Res, HttpCode, Req, UseGuards, Get } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { Env } from 'src/config/env.validation';
import ms, { StringValue } from 'ms';
import { JwtGuard } from './guards/jwt.guard';
import {
    ApiCookieAuth,
    ApiCreatedResponse,
    ApiNoContentResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';

const REFRESH_COOKIE: string = 'refresh_token';
const ACCESS_COOKIE: string = 'access_token';

@ApiTags('auth')
@Controller('auth')
@UseGuards(ThrottlerGuard) // apply rate limiting rules
export class AuthController {
    private readonly isProd: boolean;

    constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService<Env>,
    ) {
        this.isProd = this.configService.get('nodeEnv', { infer: true }) === 'production';
    }

    @Get('me')
    @UseGuards(JwtGuard)
    @ApiOperation({ summary: 'Get the current user' })
    @ApiCookieAuth('access_token')
    @ApiOkResponse({ description: 'Returns the current user ID and email' })
    @ApiUnauthorizedResponse({ description: 'Missing or invalid access cookie' })
    me(@Req() req: Request) {
        const id = req.user.sub;
        const email = req.user.email;

        return { id, email };
    }

    @Post('login')
    @HttpCode(200)
    @ApiOperation({ summary: 'Log in and set both auth cookies' })
    @ApiOkResponse({ description: 'Logged in; access and refresh cookies were set' })
    @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
    async login(@Body() body: LoginDto, @Res({ passthrough: true }) res: Response) {
        const { accessToken, refreshToken } = await this.authService.login(body);

        this.setAccessCookie(res, accessToken);
        this.setRefreshCookie(res, refreshToken);
        // return { accessToken };
    }

    @Post('register')
    @ApiOperation({ summary: 'Create an account and set both auth cookies' })
    @ApiCreatedResponse({ description: 'Account created; auth cookies were set' })
    async register(@Body() body: RegisterDto, @Res({ passthrough: true }) res: Response) {
        const { accessToken, refreshToken } = await this.authService.register(body);

        this.setAccessCookie(res, accessToken);
        this.setRefreshCookie(res, refreshToken);
        // return { accessToken };
    }

    @Post('refresh')
    @HttpCode(204)
    @ApiOperation({ summary: 'Create a new access cookie' })
    @ApiCookieAuth('refresh_token')
    @ApiNoContentResponse({ description: 'Access cookie refreshed' })
    @ApiUnauthorizedResponse({ description: 'Invalid or expired refresh cookie' })
    async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
        if (!token) return { accessToken: null };

        const { accessToken } = await this.authService.refresh(token);
        this.setAccessCookie(res, accessToken);
    }

    @Post('logout')
    @HttpCode(204)
    @ApiOperation({ summary: 'Log out and clear both auth cookies' })
    @ApiCookieAuth('refresh_token')
    @ApiNoContentResponse({ description: 'Refresh token revoked and both cookies cleared' })
    async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        await this.authService.logout(req.cookies?.[REFRESH_COOKIE] as string | undefined);

        res.clearCookie(ACCESS_COOKIE, { path: '/api' });
        res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
    }

    private setAccessCookie(res: Response, token: string) {
        // const isProd = this.configService.get('nodeEnv', { infer: true }) === 'production';

        res.cookie(ACCESS_COOKIE, token, {
            httpOnly: true,
            secure: this.isProd,
            sameSite: this.isProd ? 'none' : 'strict',
            path: '/api',
            maxAge: ms(this.configService.get('jwtAccessTtl', { infer: true }) as StringValue), // 7d, matches the refresh token's life
        });
    }

    private setRefreshCookie(res: Response, token: string) {
        // const isProd = this.configService.get('nodeEnv', { infer: true }) === 'production';

        res.cookie(REFRESH_COOKIE, token, {
            httpOnly: true, // JS can't read it -> XSS-safe
            /* 
                HTTPS only in prod; off for localhost http
                prod: frontend + backend live on different domains, so the cookie
                must cross sites → 'none' (needs secure). dev: 'strict' is CSRF-safe.
            */
            secure: this.isProd,
            sameSite: this.isProd ? 'none' : 'strict',
            path: '/api/auth', // only sent to the auth routes that need it
            maxAge: ms(this.configService.get('jwtRefreshTtl', { infer: true }) as StringValue), // 7d, matches the refresh token's life
        });
    }
}
