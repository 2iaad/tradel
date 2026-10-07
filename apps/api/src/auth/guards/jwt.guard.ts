import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { Env } from 'src/config/env.validation';
import { JwtUser } from './jwt-user.types';

@Injectable()
export class JwtGuard implements CanActivate {
    constructor(
        private readonly jwt: JwtService,
        private readonly reflector: Reflector,
        private readonly config: ConfigService<Env>,
    ) {}

    canActivate(ctx: ExecutionContext): boolean {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            ctx.getHandler(),
            ctx.getClass(),
        ]);
        if (isPublic) return true;

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
