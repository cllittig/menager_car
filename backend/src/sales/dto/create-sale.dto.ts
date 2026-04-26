import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, ValidateNested } from 'class-validator';

export class CreateInstallmentDto {
  @ApiProperty({ 
    description: 'Número da parcela', 
    example: 1 
  })
  @IsNumber()
  @IsPositive()
  number: number;

  @ApiProperty({ 
    description: 'Valor da parcela', 
    example: 10000,
    minimum: 0.01
  })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({ 
    description: 'Data de vencimento da parcela', 
    example: '2025-07-19'
  })
  @IsString()
  @IsNotEmpty()
  dueDate: string; // Será convertido para DateTime no service
}

export class CreateSaleDto {
  @ApiProperty({ 
    description: 'ID do veículo sendo vendido', 
    example: 'uuid-vehicle-example' 
  })
  @IsString()
  @IsNotEmpty()
  vehicleId: string;

  @ApiProperty({ 
    description: 'ID do cliente comprador', 
    example: 'uuid-client-example' 
  })
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @ApiProperty({ 
    description: 'Valor total da venda', 
    example: 50000,
    minimum: 0.01
  })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({ 
    description: 'Status do pagamento', 
    enum: ['PENDING', 'PAID', 'OVERDUE', 'CANCELLED'],
    example: 'PENDING'
  })
  @IsEnum(['PENDING', 'PAID', 'OVERDUE', 'CANCELLED'])
  @IsOptional()
  status?: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';

  @ApiProperty({ 
    description: 'Data da venda', 
    example: '2025-06-19',
    required: false
  })
  @IsString()
  @IsOptional()
  saleDate?: string; // Será convertido para DateTime no service

  @ApiProperty({ 
    description: 'Parcelas da venda (opcional)', 
    required: false,
    type: [CreateInstallmentDto]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInstallmentDto)
  installments?: CreateInstallmentDto[];
} 