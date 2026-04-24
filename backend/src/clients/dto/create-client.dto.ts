import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEmail, IsNotEmpty, IsOptional, IsString, Validate, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

@ValidatorConstraint({ name: 'cpf', async: false })
export class CpfValidator implements ValidatorConstraintInterface {
  validate(cpf: string, _args: ValidationArguments) {
    if (!cpf) return false;
    
    // Remove caracteres não numéricos
    const cleanCPF = cpf.replace(/\D/g, '');
    
    // Deve ter exatamente 11 dígitos
    if (cleanCPF.length !== 11) return false;
    
    // Verifica se não é uma sequência de números iguais
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
    
    // Lista de CPFs conhecidamente inválidos
    const invalidCPFs = [
      '00000000000', '11111111111', '22222222222', '33333333333',
      '44444444444', '55555555555', '66666666666', '77777777777',
      '88888888888', '99999999999', '12345678901', '01234567890'
    ];
    
    if (invalidCPFs.includes(cleanCPF)) return false;
    
    // Algoritmo oficial de validação do CPF
    // Calcula primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    let firstDigit = 11 - (sum % 11);
    if (firstDigit > 9) firstDigit = 0;
    
    if (parseInt(cleanCPF.charAt(9)) !== firstDigit) return false;
    
    // Calcula segundo dígito verificador
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
    
    // Remove caracteres não numéricos
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Telefone brasileiro: 10 dígitos (fixo) ou 11 dígitos (celular)
    if (cleanPhone.length !== 10 && cleanPhone.length !== 11) return false;
    
    // Verifica se é uma sequência de números iguais (inválido)
    if (/^(\d)\1+$/.test(cleanPhone)) return false;
    
    // DDD deve estar entre 11 e 99
    const ddd = parseInt(cleanPhone.substring(0, 2));
    const validDDDs = [
      11, 12, 13, 14, 15, 16, 17, 18, 19, // SP
      21, 22, 24, // RJ/ES
      27, 28, // ES
      31, 32, 33, 34, 35, 37, 38, // MG
      41, 42, 43, 44, 45, 46, // PR
      47, 48, 49, // SC
      51, 53, 54, 55, // RS
      61, // DF/GO
      62, 64, // GO/TO
      63, // TO
      65, 66, // MT
      67, // MS
      68, // AC
      69, // RO
      71, 73, 74, 75, 77, // BA
      79, // SE
      81, 87, // PE
      82, // AL
      83, // PB
      84, // RN
      85, 88, // CE
      86, 89, // PI
      91, 93, 94, // PA
      92, 97, // AM
      95, // RR
      96, // AP
      98, 99 // MA
    ];
    
    if (!validDDDs.includes(ddd)) return false;
    
    // Se for celular (11 dígitos), o 3º dígito deve ser 9
    if (cleanPhone.length === 11 && cleanPhone.charAt(2) !== '9') return false;
    
    // Telefone fixo não pode começar com 0 ou 1 após o DDD
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
    if (!cnh) return true; // Campo opcional
    
    // Remove caracteres não numéricos
    const cleanCNH = cnh.replace(/\D/g, '');
    
    // CNH deve ter exatamente 11 dígitos
    if (cleanCNH.length !== 11) return false;
    
    // Verifica se não é uma sequência de números iguais
    if (/^(\d)\1{10}$/.test(cleanCNH)) return false;
    
    // Lista de CNHs conhecidamente inválidos
    const invalidCNHs = [
      '00000000000', '11111111111', '22222222222', '33333333333',
      '44444444444', '55555555555', '66666666666', '77777777777',
      '88888888888', '99999999999', '12345678901', '01234567890'
    ];
    
    if (invalidCNHs.includes(cleanCNH)) return false;
    
    // Algoritmo de validação da CNH (similar ao CPF, mas com diferenças)
    let sum = 0;
    let seq = 2;
    
    // Calcula a soma dos 9 primeiros dígitos
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCNH.charAt(i)) * seq;
      seq++;
      if (seq > 9) seq = 2;
    }
    
    // Calcula o primeiro dígito verificador
    const firstDigit = sum % 11;
    const firstCheckDigit = firstDigit > 1 ? 11 - firstDigit : 0;
    
    if (parseInt(cleanCNH.charAt(9)) !== firstCheckDigit) return false;
    
    // Calcula o segundo dígito verificador
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