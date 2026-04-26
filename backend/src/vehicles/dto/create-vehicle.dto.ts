import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { FuelType, VehicleStatus } from '../../database/domain.enums';

export class CreateVehicleDto {
  @ApiProperty({ description: 'Marca do veículo' })
  @IsString()
  @IsNotEmpty()
  brand: string;

  @ApiProperty({ description: 'Modelo do veículo' })
  @IsString()
  @IsNotEmpty()
  model: string;

  @ApiProperty({ description: 'Ano do veículo' })
  @Type(() => Number)
  @IsNumber()
  @Min(1900)
  year: number;

  @ApiProperty({ description: 'Placa do veículo' })
  @IsString()
  @IsNotEmpty()
  licensePlate: string;

  @ApiProperty({ description: 'Número do chassi' })
  @IsString()
  @IsNotEmpty()
  chassis: string;

  @ApiProperty({ description: 'Quilometragem atual', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  mileage?: number;

  @ApiProperty({ description: 'Cor do veículo' })
  @IsString()
  @IsNotEmpty()
  color: string;

  @ApiProperty({ description: 'Tipo de combustível', enum: FuelType })
  @IsEnum(FuelType)
  fuelType: FuelType;

  @ApiProperty({ description: 'Preço de compra' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  purchasePrice: number;

  @ApiProperty({ description: 'Data de compra', required: false })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  purchaseDate?: Date;

  @ApiProperty({ description: 'Preço de venda', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  salePrice?: number;

  @ApiProperty({ description: 'Status do veículo', enum: VehicleStatus, required: false })
  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;

  @ApiProperty({ description: 'Se o veículo está ativo', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
