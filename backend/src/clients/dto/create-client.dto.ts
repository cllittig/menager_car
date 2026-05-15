import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEmail, IsNotEmpty, IsOptional, IsString, Validate, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

@ValidatorConstraint({ name: 'cpf', async: false })
export class CpfValidator implements ValidatorConstraintInterface {
  validate(cpf: string, _args: ValidationArguments) {
    if (!cpf) return false;


    const cleanCPF = cpf.replace(/\D/g, '');


    if (cleanCPF.length !== 11) return false;


    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;


    const invalidCPFs = [
      '00000000000', '11111111111', '22222222222', '33333333333',
      '44444444444', '55555555555', '66666666666', '77777777777',
      '88888888888', '99999999999', '12345678901', '01234567890'
    ];

    if (invalidCPFs.includes(cleanCPF)) return false;



    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    let firstDigit = 11 - (sum % 11);
    if (firstDigit > 9) firstDigit = 0;

    if (parseInt(cleanCPF.charAt(9)) !== firstDigit) return false;


    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }
    let secondDigit = 11 - (sum % 11);
    if (secondDigit > 9) secondDigit = 0;

    if (parseInt(cleanCPF.charAt(10)) !== secondDigit) return false;

    return true;
  }

  defaultMessage(_args: ValidationArguments) {
    return 'CPF inválido. Verifique os dígitos informados.';
  }
}

@ValidatorConstraint({ name: 'phone', async: false })
export class PhoneValidator implements ValidatorConstraintInterface {
  validate(phone: string, _args: ValidationArguments) {
    if (!phone) return false;


    const cleanPhone = phone.replace(/\D/g, '');


    if (cleanPhone.length !== 10 && cleanPhone.length !== 11) return false;


    if (/^(\d)\1+$/.test(cleanPhone)) return false;


    const ddd = parseInt(cleanPhone.substring(0, 2));
    const validDDDs = [
      11, 12, 13, 14, 15, 16, 17, 18, 19, 
      21, 22, 24, 
      27, 28, 
      31, 32, 33, 34, 35, 37, 38, 
      41, 42, 43, 44, 45, 46, 
      47, 48, 49, 
      51, 53, 54, 55, 
      61, 
      62, 64, 
      63, 
      65, 66, 
      67, 
      68, 
      69, 
      71, 73, 74, 75, 77, 
      79, 
      81, 87, 
      82, 
      83, 
      84, 
      85, 88, 
      86, 89, 
      91, 93, 94, 
      92, 97, 
      95, 
      96, 
      98, 99 
    ];

    if (!validDDDs.includes(ddd)) return false;


    if (cleanPhone.length === 11 && cleanPhone.charAt(2) !== '9') return false;


    if (cleanPhone.length === 10 && ['0', '1'].includes(cleanPhone.charAt(2))) return false;

    return true;
  }

  defaultMessage(_args: ValidationArguments) {
    return 'Telefone inválido. Use formato brasileiro com DDD válido.';
  }
}

@ValidatorConstraint({ name: 'cnh', async: false })
export class CnhValidator implements ValidatorConstraintInterface {
  validate(cnh: string, _args: ValidationArguments) {
    if (!cnh) return true; 


    const cleanCNH = cnh.replace(/\D/g, '');


    if (cleanCNH.length !== 11) return false;


    if (/^(\d)\1{10}$/.test(cleanCNH)) return false;


    const invalidCNHs = [
      '00000000000', '11111111111', '22222222222', '33333333333',
      '44444444444', '55555555555', '66666666666', '77777777777',
      '88888888888', '99999999999', '12345678901', '01234567890'
    ];

    if (invalidCNHs.includes(cleanCNH)) return false;


    let sum = 0;
    let seq = 2;


    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCNH.charAt(i)) * seq;
      seq++;
      if (seq > 9) seq = 2;
    }


    const firstDigit = sum % 11;
    const firstCheckDigit = firstDigit > 1 ? 11 - firstDigit : 0;

    if (parseInt(cleanCNH.charAt(9)) !== firstCheckDigit) return false;


    sum = 0;
    seq = 3;

    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCNH.charAt(i)) * seq;
      seq++;
      if (seq > 9) seq = 2;
    }

    sum += firstCheckDigit * 2;
    const secondDigit = sum % 11;
    const secondCheckDigit = secondDigit > 1 ? 11 - secondDigit : 0;

    if (parseInt(cleanCNH.charAt(10)) !== secondCheckDigit) return false;

    return true;
  }

  defaultMessage(_args: ValidationArguments) {
    return 'CNH inválida. Verifique os dígitos informados.';
  }
}

export class CreateClientDto {
  @ApiProperty({ 
    description: 'Nome completo do cliente', 
    example: 'João Silva Santos' 
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ 
    description: 'E-mail do cliente', 
    example: 'joao.silva@email.com' 
  })
  @IsEmail()
  email: string;

  @ApiProperty({ 
    description: 'Telefone do cliente (com DDD brasileiro)', 
    example: '(11) 99999-9999 ou 11999999999' 
  })
  @IsString()
  @IsNotEmpty()
  @Validate(PhoneValidator)
  phone: string;

  @ApiProperty({ 
    description: 'CPF do cliente (apenas números ou formatado)', 
    example: '12345678901 ou 123.456.789-01' 
  })
  @IsString()
  @IsNotEmpty()
  @Validate(CpfValidator)
  cpf: string;

  @ApiProperty({ 
    description: 'Número da CNH (opcional)', 
    example: '12345678901 ou vazio' 
  })
  @IsString()
  @Validate(CnhValidator)
  cnh: string;

  @ApiProperty({ 
    description: 'Endereço completo do cliente', 
    example: 'Rua das Flores, 123 - Centro - São Paulo/SP' 
  })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ 
    description: 'Data de nascimento do cliente (opcional)', 
    example: '1990-01-15',
    required: false 
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  birthDate?: Date;
} 