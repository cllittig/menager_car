import { describe, expect, it } from 'vitest';
import {
  validateLicensePlate,
  validateChassis,
  validateYear,
  validateMileage,
  validatePrice,
  validateCPF,
} from '../validations';

describe('validateLicensePlate', () => {
  it('aceita formato antigo ABC-1234', () => {
    expect(validateLicensePlate('ABC-1234').isValid).toBe(true);
    expect(validateLicensePlate('ABC1234').isValid).toBe(true);
  });

  it('aceita formato Mercosul ABC1D23', () => {
    expect(validateLicensePlate('ABC1D23').isValid).toBe(true);
    expect(validateLicensePlate('LOX-3A45').isValid).toBe(true);
  });

  it('rejeita placa vazia', () => {
    const result = validateLicensePlate('');
    expect(result.isValid).toBe(false);
    expect(result.message).toMatch(/obrigatória/i);
  });

  it('rejeita formato inválido', () => {
    expect(validateLicensePlate('12345').isValid).toBe(false);
    expect(validateLicensePlate('ABCDE1234').isValid).toBe(false);
    expect(validateLicensePlate('ABC-12').isValid).toBe(false);
  });

  it('normaliza espaços e hífens antes da validação', () => {
    expect(validateLicensePlate('ABC 1234').isValid).toBe(true);
  });
});

describe('validateChassis', () => {
  it('aceita chassi VIN de 17 caracteres sem I, O, Q', () => {
    expect(validateChassis('5JVLJR8JGRM9M4703').isValid).toBe(true);
    expect(validateChassis('1HGBH41JXMN109186').isValid).toBe(true);
  });

  it('rejeita chassi vazio', () => {
    const result = validateChassis('');
    expect(result.isValid).toBe(false);
    expect(result.message).toMatch(/obrigatório/i);
  });

  it('rejeita chassi com menos de 8 caracteres', () => {
    expect(validateChassis('ABC123').isValid).toBe(false);
  });

  it('rejeita chassi com mais de 25 caracteres', () => {
    expect(validateChassis('A'.repeat(26)).isValid).toBe(false);
  });

  it('rejeita chassi com caracteres especiais', () => {
    expect(validateChassis('ABC-123!@#').isValid).toBe(false);
  });

  it('rejeita VIN com letras I, O ou Q', () => {
    expect(validateChassis('5JVLIR8JGRM9M4703').isValid).toBe(false);
    expect(validateChassis('5JVLJR8JORM9M4703').isValid).toBe(false);
    expect(validateChassis('5JVLJR8JQRM9M4703').isValid).toBe(false);
  });

  it('aceita chassi não-VIN com menos de 17 caracteres', () => {
    expect(validateChassis('ABC12345678').isValid).toBe(true);
  });
});

describe('validateYear', () => {
  const currentYear = new Date().getFullYear();

  it('aceita ano dentro do intervalo válido', () => {
    expect(validateYear('2020').isValid).toBe(true);
    expect(validateYear('1980').isValid).toBe(true);
    expect(validateYear(String(currentYear)).isValid).toBe(true);
    expect(validateYear(String(currentYear + 1)).isValid).toBe(true);
  });

  it('rejeita ano vazio', () => {
    expect(validateYear('').isValid).toBe(false);
  });

  it('rejeita ano não-numérico', () => {
    expect(validateYear('abc').isValid).toBe(false);
  });

  it('rejeita ano anterior a 1900', () => {
    expect(validateYear('1899').isValid).toBe(false);
  });

  it('rejeita ano superior ao próximo ano', () => {
    expect(validateYear(String(currentYear + 2)).isValid).toBe(false);
  });
});

describe('validateMileage', () => {
  it('retorna válido para campo vazio (opcional)', () => {
    expect(validateMileage('').isValid).toBe(true);
  });

  it('aceita quilometragem dentro dos limites', () => {
    expect(validateMileage('0').isValid).toBe(true);
    expect(validateMileage('150000').isValid).toBe(true);
    expect(validateMileage('5000000').isValid).toBe(true);
  });

  it('rejeita valor não numérico', () => {
    expect(validateMileage('abc').isValid).toBe(false);
  });

  it('rejeita quilometragem negativa', () => {
    expect(validateMileage('-1').isValid).toBe(false);
  });

  it('rejeita quilometragem acima de 5.000.000 km', () => {
    expect(validateMileage('5000001').isValid).toBe(false);
  });
});

describe('validatePrice', () => {
  it('aceita preço válido positivo', () => {
    expect(validatePrice('50000', 'Preço').isValid).toBe(true);
    expect(validatePrice('0.01', 'Preço').isValid).toBe(true);
  });

  it('rejeita preço vazio', () => {
    const result = validatePrice('', 'Preço de compra');
    expect(result.isValid).toBe(false);
    expect(result.message).toMatch(/obrigatório/i);
  });

  it('rejeita preço não numérico', () => {
    expect(validatePrice('abc', 'Preço').isValid).toBe(false);
  });

  it('rejeita preço zero ou negativo', () => {
    expect(validatePrice('0', 'Preço').isValid).toBe(false);
    expect(validatePrice('-100', 'Preço').isValid).toBe(false);
  });

  it('rejeita preço acima do máximo R$ 50.000.000', () => {
    expect(validatePrice('50000001', 'Preço').isValid).toBe(false);
  });

  it('usa fieldName na mensagem de erro', () => {
    const result = validatePrice('', 'Preço de venda');
    expect(result.message).toContain('Preço de venda');
  });
});

describe('validateCPF', () => {
  it('aceita CPF válido com formatação', () => {
    expect(validateCPF('529.982.247-25').isValid).toBe(true);
    expect(validateCPF('52998224725').isValid).toBe(true);
  });

  it('rejeita CPF vazio', () => {
    expect(validateCPF('').isValid).toBe(false);
  });

  it('rejeita CPF com menos de 11 dígitos', () => {
    expect(validateCPF('123.456.789').isValid).toBe(false);
  });

  it('rejeita sequência repetida de dígitos (ex: 111.111.111-11)', () => {
    expect(validateCPF('111.111.111-11').isValid).toBe(false);
    expect(validateCPF('000.000.000-00').isValid).toBe(false);
  });

  it('rejeita CPF com dígito verificador inválido', () => {
    expect(validateCPF('123.456.789-00').isValid).toBe(false);
    expect(validateCPF('529.982.247-26').isValid).toBe(false);
  });
});
