import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsPositive, IsEnum, IsOptional, IsDateString } from 'class-validator';

export class CreateMaintenanceDto {
  @ApiProperty({ 
    description: 'ID do veículo em manutenção', 
    example: 'uuid-vehicle-example' 
  })
  @IsString()
  @IsNotEmpty()
  vehicleId: string;

  @ApiProperty({ 
    description: 'Descrição detalhada da manutenção', 
    example: 'Troca de óleo e filtro, revisão dos freios' 
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ 
    description: 'Custo estimado da manutenção', 
    example: 800.50,
    minimum: 0
  })
  @IsNumber()
  @IsPositive()
  cost: number;

  @ApiProperty({ 
    description: 'Data de início da manutenção', 
    example: '2025-06-20'
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({ 
    description: 'Data de conclusão da manutenção (opcional)', 
    example: '2025-06-22',
    required: false
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ 
    description: 'Status da manutenção', 
    enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    example: 'PENDING'
  })
  @IsEnum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
  @IsOptional()
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

  @ApiProperty({ 
    description: 'Nome do mecânico responsável', 
    example: 'José da Silva'
  })
  @IsString()
  @IsNotEmpty()
  mechanic: string;
} 