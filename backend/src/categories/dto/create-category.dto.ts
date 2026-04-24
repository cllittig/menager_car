import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Filtros' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;

  @ApiProperty({ required: false, example: 'Peças de filtro e lubrificantes' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
