import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class SyncPasswordRecoveryDto {
  @ApiProperty({ description: 'Nova senha (mínimo 6 caracteres)', minLength: 6 })
  @IsString()
  @MinLength(6)
  senha: string;
}
