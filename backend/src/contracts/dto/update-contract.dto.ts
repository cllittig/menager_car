import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateContractDto {
  @ApiProperty({
    description: 'Novo nome do arquivo do contrato (metadado exibido e no download)',
    example: 'contrato_venda_rev1.pdf',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fileName: string;
}
