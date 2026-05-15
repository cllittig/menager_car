"use client"

import { Input } from "@/components/ui/input"
import { ValidatedInput } from "@/components/ui/validated-input"
import type { Client } from "@/lib/clients"
import {
  formatCNH,
  formatCPF,
  formatPhone,
  validateCNH,
  validateCPF,
  validateEmail,
  validatePhone,
} from "@/lib/validations"
import { memo } from "react"

export interface ClientFormState {
  name: string
  email: string
  phone: string
  cpf: string
  cnh: string
  address: string
  birthDate: string
}

type ClientFormProps = {
  formData: ClientFormState
  onFieldChange: (field: string, value: string) => void
  clients: Client[]
  editingClient: Client | null
}

export const ClientForm = memo(function ClientForm({
  formData,
  onFieldChange,
  clients,
  editingClient,
}: ClientFormProps) {
  const validations = {
    name: formData.name ? { isValid: true } : { isValid: false, message: "Nome é obrigatório" },
    email: validateEmail(formData.email),
    phone: validatePhone(formData.phone),
    cpf: validateCPF(formData.cpf),
    cnh: validateCNH(formData.cnh),
  }

  const resolved = { ...validations }

  const isDuplicateEmail = clients.some(
    (c) =>
      c.id !== editingClient?.id &&
      c.email?.toLowerCase() === formData.email?.toLowerCase(),
  )

  const isDuplicatePhone = clients.some(
    (c) =>
      c.id !== editingClient?.id &&
      c.phone?.replace(/\D/g, "") === formData.phone?.replace(/\D/g, ""),
  )

  const isDuplicateCPF = clients.some(
    (c) =>
      c.id !== editingClient?.id &&
      c.cpf?.replace(/\D/g, "") === formData.cpf?.replace(/\D/g, ""),
  )

  if (isDuplicateEmail && resolved.email.isValid) {
    resolved.email = { isValid: false, message: "Este email já está cadastrado" }
  }

  if (isDuplicatePhone && resolved.phone.isValid) {
    resolved.phone = { isValid: false, message: "Este telefone já está cadastrado" }
  }

  if (isDuplicateCPF && resolved.cpf.isValid) {
    resolved.cpf = { isValid: false, message: "Este CPF já está cadastrado" }
  }

  return (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <ValidatedInput
          id="name"
          label="Nome Completo"
          value={formData.name}
          onChange={(value: string) => onFieldChange("name", value)}
          placeholder="Ex: João Silva Santos"
          required
          validation={resolved.name}
        />
        <ValidatedInput
          id="email"
          label="E-mail"
          type="email"
          value={formData.email}
          onChange={(value) => onFieldChange("email", value)}
          placeholder="Ex: joao@email.com"
          required
          validation={resolved.email}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ValidatedInput
          id="phone"
          label="Telefone"
          value={formData.phone}
          onChange={(value) => onFieldChange("phone", value)}
          placeholder="Ex: (11) 99999-9999"
          required
          formatValue={formatPhone}
          validation={resolved.phone}
        />
        <ValidatedInput
          id="cpf"
          label="CPF"
          value={formData.cpf}
          onChange={(value) => onFieldChange("cpf", value)}
          placeholder="Ex: 123.456.789-00"
          required
          formatValue={formatCPF}
          validation={resolved.cpf}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ValidatedInput
          id="cnh"
          label="CNH"
          value={formData.cnh}
          onChange={(value) => onFieldChange("cnh", value)}
          placeholder="11 dígitos (somente números)"
          formatValue={formatCNH}
          validation={resolved.cnh}
        />
        <div>
          <label htmlFor="birthDate" className="text-sm font-medium">
            Data de Nascimento
          </label>
          <Input
            id="birthDate"
            type="date"
            value={formData.birthDate}
            onChange={(e) => onFieldChange("birthDate", e.target.value)}
            className="mt-1"
          />
        </div>
      </div>

      <ValidatedInput
        id="address"
        label="Endereço Completo"
        value={formData.address}
        onChange={(value) => onFieldChange("address", value)}
        placeholder="Ex: Rua das Flores, 123, Centro, São Paulo - SP"
      />
    </div>
  )
})
