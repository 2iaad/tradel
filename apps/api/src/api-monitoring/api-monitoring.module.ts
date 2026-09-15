import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ApiMonitoringMiddleware } from './api-monitoring.middleware';
import { ApiMonitoringService } from './api-monitoring.service';

@Module({
    providers: [ApiMonitoringService, ApiMonitoringMiddleware],
    exports: [ApiMonitoringService],
})
export class ApiMonitoringModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(ApiMonitoringMiddleware).forRoutes({
            path: '{*splat}',
            method: RequestMethod.ALL,
        });
    }
}
