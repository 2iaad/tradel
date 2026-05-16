import { Controller, Post, Body } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  @Post('register')
  // create account
  register(@Body() body: RegisterDto) {
    // return this.authService.register(body);
    return body.username;
  }

  @Post('login')
  // generate jwt
  login(@Body() body: LoginDto) {
    // return this.authService.login(body);
    return body;
  }
}
