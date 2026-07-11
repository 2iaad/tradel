import { PartialType } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';
import { CreateTradeDto } from './create-trade.dto';

export class UpdateTradeDto extends PartialType(CreateTradeDto) {
    // Not derivable yet (no risk/stop column) — trader supplies it on close.
    @IsOptional()
    @IsNumber()
    r?: number;
}
