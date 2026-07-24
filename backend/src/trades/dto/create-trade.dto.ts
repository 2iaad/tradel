import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

const SIDES = ['LONG', 'SHORT'] as const;

export class CreateTradeDto {
    @Transform(({ value }: { value: unknown }) =>
        typeof value === 'string' ? value.trim().toUpperCase() : value,
    )
    @IsString()
    @IsNotEmpty()
    @MaxLength(20)
    symbol!: string;

    @IsIn(SIDES)
    side!: (typeof SIDES)[number];

    @IsNumber()
    entry!: number;

    @IsOptional()
    @IsNumber()
    exit?: number;

    @IsNumber()
    size!: number;
}
