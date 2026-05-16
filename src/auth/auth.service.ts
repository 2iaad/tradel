import { Injectable } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  register(body: RegisterDto) {
    // TODO: check if user already exists with that email
    // TODO: check if mail is valide + exists
    // TODO: hash password with salt + save user in db and return jwt
    return body.username;
  }

  login(body: LoginDto) {
    // TODO: check if user exist + return jwt
    return body;
  }
}
