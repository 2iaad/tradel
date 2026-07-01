import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { Env } from 'src/config/env.validation';

@Injectable()
export class JwtGuard implements CanActivate {
    constructor(
        private readonly jwt: JwtService,
        private readonly config: ConfigService<Env>,
    ) {}

    canActivate(ctx: ExecutionContext): boolean {
        const req = ctx.switchToHttp().getRequest<Request>();
        const [type, token] = req.headers.authorization?.split(' ') ?? [];
        if (type !== 'Bearer' || !token) throw new UnauthorizedException('Missing token');

        try {
            req['user'] = this.jwt.verify<{ sub: string; email: string }>(token, {
                secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
            });
        } catch {
            throw new UnauthorizedException('Invalid or expired token');
        }
        return true;
    }
}
