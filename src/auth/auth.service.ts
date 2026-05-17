import { Injectable } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(private readonly config: ConfigService) {}

  register(body: RegisterDto) {
    const db_url = this.config.get<string>('DB_URL');

    console.log(db_url);
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
