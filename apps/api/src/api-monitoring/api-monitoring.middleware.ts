import { Injectable, NestMiddleware } from '@nestjs/common';
import { ApiMonitoringService } from './api-monitoring.service';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

@Injectable()
export class ApiMonitoringMiddleware implements NestMiddleware {
    constructor(private readonly monitoring: ApiMonitoringService) {}

    use(request: Request, response: Response, next: NextFunction) {
        // no need to check this because all routes start with this prefix
        // if (!request.originalUrl.startsWith('/api')) {
        //     next();
        //     return;
        // }

        const startedAt = performance.now();
        const requestId = request.header('x-request-id') ?? randomUUID();

        response.setHeader('X-Request-Id', requestId);

        response.once('finish', () => {
            this.monitoring.logRequest({
                method: request.method,
                route: this.getRoute(request),
                status: response.statusCode,
                durationMs: performance.now() - startedAt,
                requestId,
            });
        });

        next();
    }
    private getRoute(request: Request): string {
        const route: unknown = Reflect.get(request, 'route');

        if (typeof route !== 'object' || route === null) {
            return 'unmatched';
        }

        const routePath: unknown = Reflect.get(route, 'path');

        if (typeof routePath !== 'string') {
            return 'unmatched';
        }

        return `${request.baseUrl}${routePath}`;
    }
}
