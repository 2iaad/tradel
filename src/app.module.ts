import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [AuthModule], // other modules this module depends on
  controllers: [AppController], // handle incoming requests
  providers: [AppService], // services, repositories, helpers (injectable things)
})
export class AppModule {}
