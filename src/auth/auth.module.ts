import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  controllers: [AuthController], // handles GET /users, POST /users, etc.
  providers: [AuthService], // business logic
})
export class AuthModule {}
