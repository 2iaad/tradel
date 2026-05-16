import {
  IsEmail,
  IsString,
  MaxLength,
  Length,
  IsNotEmpty,
  Matches,
} from 'class-validator';

import { Transform } from 'class-transformer';

export class RegisterDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @Length(3, 15)
  username!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(50)
  email!: string;

  @IsString()
  @IsNotEmpty()
  @Length(10, 20)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'password must contain uppercase, lowercase and a number',
  })
  password!: string;
}
