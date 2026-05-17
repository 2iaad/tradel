import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env', // not necessary .env is already the default
      isGlobal: true, // no need to imports: [ConfigModule] in other modules
    }),
    AuthModule,
  ], // other modules this module depends on
})
export class AppModule {}
