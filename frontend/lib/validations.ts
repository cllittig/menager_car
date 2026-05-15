import type { Client } from '@/lib/clients'
import type { Vehicle } from '@/lib/vehicles'

function recordFieldLower(row: Record<string, unknown>, field: string): string {
  const v = row[field]
  if (typeof v === 'string') return v.toLowerCase()
  if (v == null) return ''
  return String(v).toLowerCase()
}


export const validateLicensePlate = (plate: string): { isValid: boolean; message?: string } => {
  if (!plate) return { isValid: false, message: "Placa é obrigatória" }


  const cleanPlate = plate.replace(/[\s-]/g, '').toUpperCase()


  const oldFormat = /^[A-Z]{3}[0-9]{4}$/

  const mercosulFormat = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/

  if (!oldFormat.test(cleanPlate) && !mercosulFormat.test(cleanPlate)) {
    return { 
      isValid: false, 
      message: "Formato inválido. Use ABC-1234 (antigo) ou ABC1D23 (Mercosul)" 
    }
  }

  return { isValid: true }
}

export const validateChassis = (chassis: string): { isValid: boolean; message?: string } => {
  if (!chassis) return { isValid: false, message: "Chassi é obrigatório" }


  const cleanChassis = chassis.replace(/\s/g, '').toUpperCase()


  if (cleanChassis.length < 8) {
    return { isValid: false, message: "Chassi deve ter pelo menos 8 caracteres" }
  }

  if (cleanChassis.length > 25) {
    return { isValid: false, message: "Chassi deve ter no máximo 25 caracteres" }
  }


  if (!/^[A-Z0-9]+$/.test(cleanChassis)) {
    return { isValid: false, message: "Chassi deve conter apenas letras e números" }
  }


  if (cleanChassis.length === 17) {

    if (/[IOQ]/.test(cleanChassis)) {
      return { isValid: false, message: "Chassi VIN não pode conter as letras I, O ou Q" }
    }
  }

  return { isValid: true }
}

export const validateYear = (year: string): { isValid: boolean; message?: string } => {
  if (!year) return { isValid: false, message: "Ano é obrigatório" }

  const yearNum = parseInt(year)
  const currentYear = new Date().getFullYear()

  if (isNaN(yearNum)) {
    return { isValid: false, message: "Ano deve ser um número" }
  }

  if (yearNum < 1900 || yearNum > currentYear + 1) {
    return { isValid: false, message: `Ano deve estar entre 1900 e ${currentYear + 1}` }
  }

  return { isValid: true }
}

export const validateMileage = (mileage: string): { isValid: boolean; message?: string } => {
  if (!mileage) return { isValid: true } // Campo opcional

  const mileageNum = parseInt(mileage)

  if (isNaN(mileageNum)) {
    return { isValid: false, message: "Quilometragem deve ser um número" }
  }

  if (mileageNum < 0) {
    return { isValid: false, message: "Quilometragem não pode ser negativa" }
  }

  if (mileageNum > 5000000) {
    return { isValid: false, message: "Quilometragem muito alta (máximo 5.000.000 km)" }
  }

  return { isValid: true }
}

export const validatePrice = (price: string, fieldName: string): { isValid: boolean; message?: string } => {
  if (!price) return { isValid: false, message: `${fieldName} é obrigatório` }

  const priceNum = parseFloat(price)

  if (isNaN(priceNum)) {
    return { isValid: false, message: `${fieldName} deve ser um número` }
  }

  if (priceNum <= 0) {
    return { isValid: false, message: `${fieldName} deve ser maior que zero` }
  }

  if (priceNum > 50000000) {
    return { isValid: false, message: `${fieldName} muito alto (máximo R$ 50.000.000)` }
  }

  return { isValid: true }
}

// Validações para Clientes
export const validateCPF = (cpf: string): { isValid: boolean; message?: string } => {
  if (!cpf) return { isValid: false, message: "CPF é obrigatório" }

  // Remove caracteres não numéricos
  const cleanCPF = cpf.replace(/\D/g, '')

  if (cleanCPF.length !== 11) {
    return { isValid: false, message: "CPF deve ter 11 dígitos" }
  }

  // Verifica se não é uma sequência de números iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) {
    return { isValid: false, message: "CPF inválido" }
  }

  // Valida dígitos verificadores
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i)
  }
  let firstDigit = 11 - (sum % 11)
  if (firstDigit > 9) firstDigit = 0

  if (parseInt(cleanCPF.charAt(9)) !== firstDigit) {
    return { isValid: false, message: "CPF inválido" }
  }

  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i)
  }
  let secondDigit = 11 - (sum % 11)
  if (secondDigit > 9) secondDigit = 0

  if (parseInt(cleanCPF.charAt(10)) !== secondDigit) {
    return { isValid: false, message: "CPF inválido" }
  }

  return { isValid: true }
}

export const validateEmail = (email: string): { isValid: boolean; message?: string } => {
  if (!email) return { isValid: false, message: "Email é obrigatório" }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailRegex.test(email)) {
    return { isValid: false, message: "Email inválido" }
  }

  return { isValid: true }
}

export const validatePhone = (phone: string): { isValid: boolean; message?: string } => {
  if (!phone) return { isValid: false, message: "Telefone é obrigatório" }

  // Remove caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, '')

  // Telefone brasileiro: 10 dígitos (fixo) ou 11 dígitos (celular)
  if (cleanPhone.length !== 10 && cleanPhone.length !== 11) {
    return { isValid: false, message: "Telefone deve ter 10 ou 11 dígitos" }
  }

  // Verifica se é uma sequência de números iguais (inválido)
  if (/^(\d)\1+$/.test(cleanPhone)) {
    return { isValid: false, message: "Telefone inválido" }
  }

  // DDD deve ser válido (códigos oficiais brasileiros)
  const ddd = parseInt(cleanPhone.substring(0, 2))
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
  ]

  if (!validDDDs.includes(ddd)) {
    return { isValid: false, message: "DDD inválido" }
  }

  // Se for celular (11 dígitos), o 3º dígito deve ser 9
  if (cleanPhone.length === 11 && cleanPhone.charAt(2) !== '9') {
    return { isValid: false, message: "Celular deve começar com 9 após o DDD" }
  }

  // Telefone fixo não pode começar com 0 ou 1 após o DDD
  if (cleanPhone.length === 10 && ['0', '1'].includes(cleanPhone.charAt(2))) {
    return { isValid: false, message: "Telefone fixo não pode começar com 0 ou 1 após o DDD" }
  }

  return { isValid: true }
}

/** Validação dos dígitos verificadores da CNH (DETRAN — pesos 9..1 e 1..9, com regra de excedente 10). */
export const validateCNH = (cnh: string): { isValid: boolean; message?: string } => {
  if (!cnh) return { isValid: true }

  const d = cnh.replace(/\D/g, '')

  if (d.length !== 11) {
    return { isValid: false, message: 'CNH deve ter 11 dígitos' }
  }

  if (/^(\d)\1{10}$/.test(d)) {
    return { isValid: false, message: 'CNH inválida' }
  }

  let v = 0
  for (let i = 0, j = 9; i < 9; i++, j--) {
    v += parseInt(d[i], 10) * j
  }
  let dsc = 0
  let vl1 = v % 11
  if (vl1 >= 10) {
    vl1 = 0
    dsc = 2
  }
  if (vl1 !== parseInt(d[9], 10)) {
    return { isValid: false, message: 'CNH inválida' }
  }

  v = 0
  for (let i = 0, j = 1; i < 9; i++, j++) {
    v += parseInt(d[i], 10) * j
  }
  let vl2 = v % 11
  if (vl2 >= 10) {
    vl2 = 0
  } else {
    vl2 -= dsc
  }
  if (vl2 < 0) vl2 += 11
  if (vl2 >= 10) vl2 = 0
  if (vl2 !== parseInt(d[10], 10)) {
    return { isValid: false, message: 'CNH inválida' }
  }

  return { isValid: true }
}

// Função para formatar entrada de dados
export const formatLicensePlate = (value: string): string => {
  // Remove apenas espaços e hífens, mantém letras e números
  const clean = value.replace(/[\s-]/g, '').toUpperCase().slice(0, 8)

  // Se tem pelo menos 3 caracteres e o 4º é um número, aplica formato antigo
  if (clean.length > 3 && /^[A-Z]{3}[0-9]/.test(clean)) {
    const letters = clean.slice(0, 3)
    const numbers = clean.slice(3)
    return `${letters}-${numbers}`
  }

  // Para formato Mercosul (ABC1D23), não adiciona hífen
  if (clean.length > 3 && /^[A-Z]{3}[0-9][A-Z]/.test(clean)) {
    return clean
  }

  return clean
}

export const formatCPF = (value: string): string => {
  const clean = value.replace(/\D/g, '').slice(0, 11)
  if (clean.length <= 3) return clean
  if (clean.length <= 6) return `${clean.slice(0, 3)}.${clean.slice(3)}`
  if (clean.length <= 9) return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6)}`
  return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9)}`
}

export const formatPhone = (value: string): string => {
  const clean = value.replace(/\D/g, '').slice(0, 11)
  if (clean.length <= 2) return clean
  if (clean.length <= 6) return `(${clean.slice(0, 2)}) ${clean.slice(2)}`
  if (clean.length <= 10) return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`
  return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`
}

/** CNH: apenas dígitos (11 posições). Não reutilizar máscara de CPF. */
export const formatCNH = (value: string): string => {
  return value.replace(/\D/g, '').slice(0, 11)
}

// Validação de unicidade (será chamada antes de salvar)
export interface UniquenessValidation {
  field: string
  value: string
  excludeId?: string
}

export const checkVehicleUniqueness = async (
  validations: UniquenessValidation[],
  existingVehicles: Vehicle[],
): Promise<{ isValid: boolean; messages: string[] }> => {
  const messages: string[] = []

  for (const validation of validations) {
    const { field, value, excludeId } = validation

    if (!value) continue

    const isDuplicate = existingVehicles.some((vehicle) =>
      vehicle.id !== excludeId &&
      recordFieldLower(vehicle as unknown as Record<string, unknown>, field) === value.toLowerCase(),
    )

    if (isDuplicate) {
      const fieldName = field === 'licensePlate' ? 'Placa' : 'Chassi'
      messages.push(`${fieldName} "${value}" já está em uso`)
    }
  }

  return {
    isValid: messages.length === 0,
    messages
  }
}

export const checkClientUniqueness = async (
  validations: UniquenessValidation[],
  existingClients: Client[],
): Promise<{ isValid: boolean; messages: string[] }> => {
  const messages: string[] = []

  for (const validation of validations) {
    const { field, value, excludeId } = validation

    if (!value) continue

    const isDuplicate = existingClients.some((client) =>
      client.id !== excludeId &&
      recordFieldLower(client as unknown as Record<string, unknown>, field) === value.toLowerCase(),
    )

    if (isDuplicate) {
      let fieldName = field
      if (field === 'cpf') fieldName = 'CPF'
      else if (field === 'email') fieldName = 'Email'
      else if (field === 'phone') fieldName = 'Telefone'

      messages.push(`${fieldName} "${value}" já está em uso`)
    }
  }

  return {
    isValid: messages.length === 0,
    messages
  }
} 