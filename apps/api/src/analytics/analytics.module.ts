import { Module } from '@nestjs/common';

import { AccountsModule } from 'src/accounts/accounts.module';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsRepository } from './analytics.repository';

@Module({
    imports: [
        AccountsModule, // to inject AccountsRepository
    ],
    controllers: [AnalyticsController],
    providers: [AnalyticsService, AnalyticsRepository],
})
export class AnalyticsModule {}
