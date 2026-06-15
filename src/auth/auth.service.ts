import { Injectable, Logger } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';
import { Env } from 'src/config/env.validation';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name); // checked only at compile-time
    constructor(private readonly config: ConfigService<Env>) {} // <Env> so infer knows the type

    register(body: RegisterDto) {
        const port = this.config.get('PORT', { infer: true }); // infer: true -> return type from the schema instead

        this.logger.log(port);
        // TODO: check if user already exists with that email
        // TODO: check if mail is valide + exists
        // TODO: hash password with salt + save user in db and return jwt
        return body;
    }

    login(body: LoginDto) {
        // TODO: check if user exist + return jwt
        return body;
    }
}
