import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsUrl, MaxLength } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'usuario@exemplo.com' })
  @IsEmail()
  email: string;


  @ApiPropertyOptional({ example: 'http://192.168.1.10:3000' })
  @IsOptional()
  @IsUrl({ require_tld: false, require_protocol: true })
  @MaxLength(512)
  clientOrigin?: string;
}
