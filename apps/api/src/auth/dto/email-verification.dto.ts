import { PickType } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';
import { RegisterDto } from './register.dto';

export class VerifyEmailDto {
    @IsString()
    @Length(64, 64)
    @Matches(/^[a-f0-9]+$/)
    token!: string;
}

export class ResendVerificationDto extends PickType(RegisterDto, ['email']) {}
