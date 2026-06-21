import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersRepository } from 'src/users/users.repository';

@Module({
    controllers: [AuthController], // handles GET /users, POST /users, etc.
    providers: [AuthService, UsersRepository], // business logic
})
export class AuthModule {}
