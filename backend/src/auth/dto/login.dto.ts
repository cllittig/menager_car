import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from "class-validator";

export class LoginDto {
    @ApiProperty({
        description: 'E-mail do usuário',
        example: 'seu@email.com',
        format: 'email'
    })
    @IsEmail()
    email: string;

    @ApiProperty({
        description: 'Senha do usuário',
        example: 'sua-senha-segura',
        minLength: 6
    })
    @IsString()
    senha: string;
}