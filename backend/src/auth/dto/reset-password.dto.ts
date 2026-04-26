import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token recebido por e-mail' })
  @IsString()
  @MinLength(20)
  token: string;

  @ApiProperty({ minLength: 6 })
  @IsString()
  @MinLength(6)
  senha: string;
}
