import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUsuarioDto {
  @ApiProperty({ description: 'Nome do usuário' })
  @IsString()
  nome: string;

  @ApiProperty({
    description: 'Nome da empresa ou concessionária. Se informado, fica associado à sua conta.',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  nomeEmpresa?: string;

  @ApiProperty({ description: 'E-mail do usuário', example: 'usuario@exemplo.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Senha do usuário' })
  @IsString()
  senha: string;
}
