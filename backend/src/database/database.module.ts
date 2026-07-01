import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Global() // so i can use DatabaseService without even needing to import it inside other modueles
@Module({
    providers: [DatabaseService],
    exports: [DatabaseService],
})
export class DatabaseModule {}
