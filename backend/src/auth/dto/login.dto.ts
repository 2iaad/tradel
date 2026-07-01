import { PickType } from '@nestjs/mapped-types'; // package lets you create new DTO classes by transforming existing ones — picking, omitting, modifying fields
import { RegisterDto } from './register.dto';

/**
 * PickType picks fields you need from RegisterDto,
 * any change to email or password validation in RegisterDto automatically applies to LoginDto.
 */

export class LoginDto extends PickType(RegisterDto, ['email', 'password']) {}
