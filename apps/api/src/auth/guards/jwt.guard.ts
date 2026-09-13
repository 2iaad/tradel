import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { Env } from 'src/config/env.validation';
import { JwtUser } from './jwt-user.types';

@Injectable()
export class JwtGuard implements CanActivate {
    constructor(
        private readonly jwt: JwtService,
        private readonly config: ConfigService<Env>,
    ) {}

    canActivate(ctx: ExecutionContext): boolean {
        const req = ctx.switchToHttp().getRequest<Request>();

        const token = req.cookies?.access_token as string | undefined;
        if (!token) throw new UnauthorizedException('Missing access token');

        try {
            const secret = this.config.get('jwtAccessSecret', { infer: true });
            const payload = this.jwt.verify<JwtUser>(token, {
                secret: secret,
            });
            req.user = payload; // now request has (sub + email) of authenticated user
        } catch {
            throw new UnauthorizedException('Invalid or expired token');
        }

        return true;
    }
}
