import { PickType } from '@nestjs/swagger'; // swagger's PickType carries @ApiProperty doc metadata across (mapped-types' does not); still validates like mapped-types
import { RegisterDto } from './register.dto';

/**
 * PickType picks fields you need from RegisterDto,
 * any change to email or password validation in RegisterDto automatically applies to LoginDto.
 */

export class LoginDto extends PickType(RegisterDto, ['email', 'password']) {}
