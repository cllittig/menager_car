import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { OptimizedImage } from '@/components/ui/optimized-image'
import { VehicleStatusBadge } from '@/components/vehicles/vehicle-status-badge'
import { useCurrency } from '@/hooks/use-currency'
import type { Vehicle } from '@/lib/services/vehicle.service'
import { Edit, Trash2 } from 'lucide-react'
import { memo, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface VehicleCardProps {
  vehicle: Vehicle
  onEdit: (vehicle: Vehicle) => void
  onDelete: (vehicle: Vehicle) => void
  isDeleting?: boolean
  isActionLoading?: boolean
  className?: string
}

export const VehicleCard = memo<VehicleCardProps>(({
  vehicle,
  onEdit,
  onDelete,
  isDeleting = false,
  isActionLoading = false,
  className
}) => {
  const { formatMoney } = useCurrency()

  const getFuelTypeText = useCallback((fuelType: string) => {
    switch (fuelType) {
      case 'GASOLINE': return 'Gasolina'
      case 'ETHANOL': return 'Etanol'
      case 'FLEX': return 'Flex'
      case 'DIESEL': return 'Diesel'
      case 'ELECTRIC': return 'Elétrico'
      case 'HYBRID': return 'Híbrido'
      default: return fuelType
    }
  }, [])

  const handleEdit = useCallback(() => {
    if (!isActionLoading) {
      onEdit(vehicle)
    }
  }, [isActionLoading, onEdit, vehicle])

  const handleDelete = useCallback(() => {
    if (!isActionLoading && !isDeleting) {
      onDelete(vehicle)
    }
  }, [isActionLoading, isDeleting, onDelete, vehicle])

  return (
    <Card className={cn('relative overflow-hidden transition-shadow duration-200 hover:shadow-elevation2 fade-in group', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base font-semibold leading-snug sm:text-lg">
            {vehicle.brand} {vehicle.model}
          </CardTitle>
          <VehicleStatusBadge status={vehicle.status} className="shrink-0" />
        </div>
        <CardDescription className="text-sm leading-relaxed">
          {vehicle.year} • {vehicle.color} • {vehicle.licensePlate}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {/* Imagem do veículo (se disponível) */}
        {vehicle.imageUrl && (
          <div className="mb-4">
            <OptimizedImage
              src={vehicle.imageUrl}
              alt={`${vehicle.brand} ${vehicle.model} ${vehicle.year}`}
              aspectRatio="landscape"
              className="rounded-md"
              priority={false}
            />
          </div>
        )}
        
        <div className="space-y-2 text-sm leading-relaxed">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Combustível:</span>
            <span>{getFuelTypeText(vehicle.fuelType)}</span>
          </div>
          
          {vehicle.mileage && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Quilometragem:</span>
              <span>{vehicle.mileage.toLocaleString()} km</span>
            </div>
          )}
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Data de Entrada:</span>
            <span>{new Date(vehicle.purchaseDate || new Date()).toLocaleDateString('pt-BR')}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Preço de Compra:</span>
            <span className="font-medium tabular-nums">{formatMoney(vehicle.purchasePrice)}</span>
          </div>
          
          {vehicle.salePrice && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Preço de Venda:</span>
              <span className="font-medium tabular-nums">{formatMoney(vehicle.salePrice)}</span>
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-2 mt-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleEdit}
            disabled={isActionLoading}
            title="Editar veículo"
            aria-label={`Editar ${vehicle.brand} ${vehicle.model}`}
            className="min-h-11 min-w-11 shrink-0 p-0"
          >
            <Edit className="h-4 w-4" />
            <span className="sr-only">Editar {vehicle.brand} {vehicle.model}</span>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="min-h-11 min-w-11 shrink-0 p-0 text-destructive hover:text-destructive"
            onClick={handleDelete}
            disabled={isActionLoading || isDeleting}
            title="Excluir veículo"
            aria-label={`Excluir ${vehicle.brand} ${vehicle.model}`}
          >
            {isDeleting ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-destructive" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            <span className="sr-only">Excluir {vehicle.brand} {vehicle.model}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
})

VehicleCard.displayName = 'VehicleCard' 