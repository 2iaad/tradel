import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    @HttpCode(201)
    // create account
    register(@Body() body: RegisterDto) {
        return this.authService.register(body);
    }

    @Post('login')
    // generate jwt
    login(@Body() body: LoginDto) {
        return this.authService.login(body);
    }
}
