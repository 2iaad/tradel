import { Injectable, Logger } from '@nestjs/common';

type apiRequestLog = {
    method: string;
    route: string;
    status: number;
    durationMs: number;
    requestId: string;
};

@Injectable()
export class ApiMonitoringService {
    private readonly logger = new Logger(ApiMonitoringService.name);

    logRequest(request: apiRequestLog): void {
        const durationMs = Math.round(request.durationMs);

        this.logger.log(
            `${request.method} ${request.route} ` +
                `${request.status} ${durationMs}ms ` +
                `[${request.requestId}]`,
        );
    }

    logRequestJSON(request: apiRequestLog) {
        const event = {
            event: 'api_request',
            method: request.method,
            route: request.route,
            status: request.status,
            durationMs: request.durationMs,
            requestId: request.requestId,
            timestamp: new Date().toISOString(),
        };

        try {
            this.logger.log(JSON.stringify(event));
        } catch {
            // nothing so logging never stops
        }
    }
}
