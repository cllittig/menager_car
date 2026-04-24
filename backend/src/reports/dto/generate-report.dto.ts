import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class GenerateReportDto {
  @ApiProperty({ example: 'DASHBOARD', description: 'Tipo do relatório' })
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  reportType: string;

  @ApiProperty({ required: false, example: 'Resumo operacional — abril/2026' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;
}
