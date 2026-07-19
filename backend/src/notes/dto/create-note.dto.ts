import {
    IsUUID,
    IsArray,
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
    ArrayMaxSize,
} from 'class-validator';

export class CreateNoteDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    title!: string;

    @IsString()
    @IsNotEmpty()
    body!: string;

    @IsOptional()
    @IsArray()
    @ArrayMaxSize(5)
    @IsString({ each: true })
    @MaxLength(20, { each: true })
    tags?: string[];

    @IsUUID()
    tradeId!: string;
}
