import { Controller, Post, Body } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  @Post('register')
  // create account
  register(
    @Body() body: { username: string; email: string; password: string },
  ) {
    // return this.authService.register(body);
    return body;
  }

  @Post('login')
  // generate jwt
  login(@Body() body: { email: string; password: string }) {
    // return this.authService.login(body);
    return body;
  }
}
