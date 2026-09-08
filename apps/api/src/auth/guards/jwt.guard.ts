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

        const authHeader = req.headers.authorization;
        let type = '';
        let token = '';
        if (authHeader) {
            const parts = authHeader.split(' ');
            type = parts[0];
            token = parts[1];
        }

        if (type !== 'Bearer' || !token) {
            throw new UnauthorizedException('Missing token');
        }

        try {
            const secret = this.config.get('JWT_ACCESS_SECRET', { infer: true });
            const payload = this.jwt.verify<JwtUser>(token, {
                secret: secret,
            });
            req.user = payload; // now the request has the sub and email of authenticated user
        } catch {
            throw new UnauthorizedException('Invalid or expired token');
        }

        return true;
    }
}
