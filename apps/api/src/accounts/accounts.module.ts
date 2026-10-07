import { Module } from '@nestjs/common';

import { AccountsService } from './accounts.service';
import { AccountsController } from './accounts.controller';
import { AccountsRepository } from './accounts.repository';

@Module({
    controllers: [AccountsController],
    providers: [AccountsService, AccountsRepository],
    exports: [AccountsRepository], // reused by TradesModule to check if account belongs to valide user
})
export class AccountsModule {}
