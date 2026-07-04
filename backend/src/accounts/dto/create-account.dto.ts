import { IsIn, IsNotEmpty, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

const CURRENCIES = ['USD', 'EUR', 'GBP'] as const;

export class CreateAccountDto {
    @Transform(({ value }: { value: unknown }) =>
        typeof value === 'string' ? value.trim() : value,
    )
    @IsString()
    @IsNotEmpty()
    @Length(1, 50)
    name!: string;

    @IsOptional()
    @IsString()
    @MaxLength(60)
    broker?: string;

    @IsOptional()
    @IsString()
    @IsIn(CURRENCIES)
    currency?: string;
}
