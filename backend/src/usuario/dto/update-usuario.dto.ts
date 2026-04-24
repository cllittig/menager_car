import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUsuarioDto {
  @ApiProperty({ 
    description: 'Nome do usuário', 
    example: 'João Silva',
    required: false 
  })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiProperty({ 
    description: 'E-mail do usuário', 
    example: 'joao@exemplo.com',
    format: 'email',
    required: false 
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ 
    description: 'Nova senha do usuário', 
    example: 'novasenha123',
    minLength: 6,
    required: false 
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  senha?: string;

  @ApiProperty({
    description: 'Papel no sistema (apenas administrador deve alterar)',
    enum: ['USER', 'EMPLOYEE', 'ADMIN'],
    required: false,
  })
  @IsOptional()
  @IsIn(['USER', 'EMPLOYEE', 'ADMIN'])
  role?: 'USER' | 'EMPLOYEE' | 'ADMIN';
}
