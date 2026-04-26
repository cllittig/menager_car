import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateReportScheduleDto {
  @ApiProperty({ example: 'DASHBOARD' })
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  reportType: string;

  @ApiProperty({ example: '0 8 * * 1', description: 'Expressão cron (envio real requer worker em produção)' })
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  cronExpression: string;

  @ApiProperty({ example: 'gestor@concessionaria.com' })
  @IsEmail()
  emailTo: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
