import { Module } from '@nestjs/common';

import { AccountsModule } from 'src/accounts/accounts.module';
import { TradesService } from './trades.service';
import { TradesController } from './trades.controller';
import { TradesRepository } from './trades.repository';

@Module({
    // AccountsModule exports AccountsRepository for the ownership check.
    imports: [AccountsModule],
    controllers: [TradesController],
    providers: [TradesService, TradesRepository],
    exports: [TradesRepository],
})
export class TradesModule {}
