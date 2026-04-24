import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ValidatedInput } from '@/components/ui/validated-input'
import type { Vehicle } from '@/lib/services/vehicle.service'
import {
    formatLicensePlate,
    validateChassis,
    validateLicensePlate,
    validateMileage,
    validatePrice,
    validateYear
} from '@/lib/validations'
import { memo } from 'react'

// Lista de marcas populares no Brasil
const CAR_BRANDS = [
  "Chevrolet", "Volkswagen", "Fiat", "Ford", "Hyundai", "Toyota", "Honda", 
  "Renault", "Nissan", "Peugeot", "Citroën", "Jeep", "Mitsubishi", "Kia",
  "BMW", "Mercedes-Benz", "Audi", "Volvo", "Land Rover", "Porsche",
  "Ferrari", "Lamborghini", "Maserati", "Bentley", "Rolls-Royce",
  "Subaru", "Suzuki", "Mazda", "Lexus", "Infiniti", "Acura",
  "Mini", "Smart", "Jaguar", "Alfa Romeo", "Fiat Professional",
  "Iveco", "Mercedes-Benz Caminhões", "Volvo Caminhões", "Scania", "MAN"
].sort()

interface VehicleFormData {
  brand: string
  model: string
  year: string
  licensePlate: string
  color: string
  chassis: string
  fuelType: string
  mileage: string
  purchasePrice: string
  salePrice: string
  purchaseDate: string
  status: string
  isActive: boolean
}

interface VehicleFormProps {
  formData: VehicleFormData
  onFieldChange: (field: string, value: string) => void
  vehicles: Vehicle[]
  editingVehicle: Vehicle | null
  className?: string
}

export const VehicleForm = memo<VehicleFormProps>(({ 
  formData, 
  onFieldChange, 
  vehicles, 
  editingVehicle,
  className 
}) => {
  // Validações em tempo real
  const validations = {
    year: validateYear(formData.year),
    licensePlate: validateLicensePlate(formData.licensePlate),
    chassis: validateChassis(formData.chassis),
    mileage: validateMileage(formData.mileage),
    purchasePrice: validatePrice(formData.purchasePrice, 'Preço de compra'),
    salePrice: formData.salePrice ? validatePrice(formData.salePrice, 'Preço de venda') : { isValid: true }
  }

  // Verifica duplicatas
  const isDuplicatePlate = vehicles.some(v => 
    v.id !== editingVehicle?.id && 
    v.licensePlate?.toLowerCase() === formData.licensePlate?.toLowerCase()
  )
  
  const isDuplicateChassis = vehicles.some(v => 
    v.id !== editingVehicle?.id && 
    v.chassis?.toLowerCase() === formData.chassis?.toLowerCase()
  )

  if (isDuplicatePlate && validations.licensePlate.isValid) {
    validations.licensePlate = { isValid: false, message: "Esta placa já está cadastrada" }
  }

  if (isDuplicateChassis && validations.chassis.isValid) {
    validations.chassis = { isValid: false, message: "Este chassi já está cadastrado" }
  }

  return (
    <div className={`grid gap-4 py-4 ${className || ''}`}>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="brand">Marca <span className="text-red-500">*</span></Label>
          <Select value={formData.brand} onValueChange={(value) => onFieldChange('brand', value)}>
            <SelectTrigger id="brand" name="brand" className={!formData.brand ? "border-red-500" : ""}>
              <SelectValue placeholder="Selecione uma marca" />
            </SelectTrigger>
            <SelectContent>
              {CAR_BRANDS.map((brand) => (
                <SelectItem key={brand} value={brand}>{brand}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!formData.brand && (
            <p className="text-sm text-red-600 mt-1">Marca é obrigatória</p>
          )}
        </div>
        <div>
          <ValidatedInput
            id="model"
            label="Modelo"
            value={formData.model}
            onChange={(value) => onFieldChange('model', value)}
            placeholder="Ex: Corolla"
            required
            validation={formData.model ? { isValid: true } : { isValid: false, message: "Modelo é obrigatório" }}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <ValidatedInput
          id="year"
          label="Ano"
          type="number"
          value={formData.year}
          onChange={(value) => onFieldChange('year', value)}
          placeholder="Ex: 2020"
          required
          validation={validations.year}
        />
        <ValidatedInput
          id="licensePlate"
          label="Placa"
          value={formData.licensePlate}
          onChange={(value) => onFieldChange('licensePlate', value)}
          placeholder="Ex: ABC-1234 ou ABC1D23"
          maxLength={8}
          required
          formatValue={formatLicensePlate}
          validation={validations.licensePlate}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <ValidatedInput
            id="color"
            label="Cor"
            value={formData.color}
            onChange={(value) => onFieldChange('color', value)}
            placeholder="Ex: Branco"
            required
            validation={formData.color ? { isValid: true } : { isValid: false, message: "Cor é obrigatória" }}
          />
        </div>
        <ValidatedInput
          id="chassis"
          label="Chassi"
          value={formData.chassis}
          onChange={(value) => onFieldChange('chassis', value.toUpperCase())}
          placeholder="Ex: 9BD12345678901234 (8-25 caracteres)"
          maxLength={25}
          required
          validation={validations.chassis}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fuelType">Combustível <span className="text-red-500">*</span></Label>
          <Select value={formData.fuelType} onValueChange={(value) => onFieldChange('fuelType', value)}>
            <SelectTrigger id="fuelType" name="fuelType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GASOLINE">Gasolina</SelectItem>
              <SelectItem value="ETHANOL">Etanol</SelectItem>
              <SelectItem value="FLEX">Flex</SelectItem>
              <SelectItem value="DIESEL">Diesel</SelectItem>
              <SelectItem value="ELECTRIC">Elétrico</SelectItem>
              <SelectItem value="HYBRID">Híbrido</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="status">Status <span className="text-red-500">*</span></Label>
          <Select value={formData.status} onValueChange={(value) => onFieldChange('status', value)}>
            <SelectTrigger id="status" name="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AVAILABLE">Disponível</SelectItem>
              <SelectItem value="SOLD">Vendido</SelectItem>
              <SelectItem value="MAINTENANCE">Manutenção</SelectItem>
              <SelectItem value="RESERVED">Reservado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ValidatedInput
          id="mileage"
          label="Quilometragem"
          type="number"
          value={formData.mileage}
          onChange={(value) => onFieldChange('mileage', value)}
          placeholder="Ex: 50000"
          validation={validations.mileage}
        />
        <div />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ValidatedInput
          id="purchasePrice"
          label="Preço de Compra"
          type="number"
          step="0.01"
          value={formData.purchasePrice}
          onChange={(value) => onFieldChange('purchasePrice', value)}
          placeholder="Ex: 45000.00"
          required
          validation={validations.purchasePrice}
        />
        <ValidatedInput
          id="salePrice"
          label="Preço de Venda"
          type="number"
          step="0.01"
          value={formData.salePrice}
          onChange={(value) => onFieldChange('salePrice', value)}
          placeholder="Ex: 55000.00"
          validation={validations.salePrice}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="purchaseDate">Data de Entrada <span className="text-red-500">*</span></Label>
          <Input
            id="purchaseDate"
            type="date"
            value={formData.purchaseDate}
            onChange={(e) => onFieldChange('purchaseDate', e.target.value)}
            className={!formData.purchaseDate ? "border-red-500" : ""}
          />
          {!formData.purchaseDate && (
            <p className="text-sm text-red-600 mt-1">Data de entrada é obrigatória</p>
          )}
        </div>
        <div />
      </div>
    </div>
  )
})

VehicleForm.displayName = 'VehicleForm' 