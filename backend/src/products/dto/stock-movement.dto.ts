import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';
import { StockMovementType } from '../../database/domain.enums';

export class CreateStockMovementDto {
  @ApiProperty({ enum: StockMovementType, example: StockMovementType.IN })
  @IsEnum(StockMovementType)
  type: StockMovementType;

  @ApiProperty({ example: 10, minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class AdjustStockDto {
  @ApiProperty({ example: 25, description: 'Nova quantidade absoluta em estoque' })
  @IsInt()
  @Min(0)
  quantityOnHand: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  note?: string;
}
