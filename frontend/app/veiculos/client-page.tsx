"use client"

import { ErrorBanner, PageHeader } from "@/components/layout/page-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { VehicleCard } from "@/components/vehicles/vehicle-card"
import { VehicleFilters } from "@/components/vehicles/vehicle-filters"
import { VehicleForm } from "@/components/vehicles/vehicle-form"
import { ConfirmDestructiveDialog } from "@/components/confirm-destructive-dialog"
import { VehiclesGridSkeleton } from "@/components/vehicles/vehicles-grid-skeleton"
import { announceToScreenReader } from "@/lib/accessibility"
import { useCreateVehicle, useDeleteVehicle, useUpdateVehicle, useVehicles } from "@/lib/hooks/use-vehicles"
import type { Vehicle } from "@/lib/vehicles"
import { Car, Plus } from "lucide-react"
import { useCallback, useMemo, useState } from "react"

// Tipos para o formulário
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

export default function VeiculosPageClient() {
  // Estados locais para UI
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null)

  // Estados para filtros
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [dateFromFilter, setDateFromFilter] = useState<string>('')
  const [dateToFilter, setDateToFilter] = useState<string>('')

  // Form data for editing/adding
  const [formData, setFormData] = useState<VehicleFormData>({
    brand: '',
    model: '',
    year: '',
    licensePlate: '',
    color: '',
    chassis: '',
    fuelType: 'GASOLINE',
    mileage: '',
    purchasePrice: '',
    salePrice: '',
    purchaseDate: '',
    status: 'AVAILABLE',
    isActive: true
  })

  // React Query hooks
  const { data: vehicles = [], isLoading, error } = useVehicles()
  const createVehicleMutation = useCreateVehicle()
  const updateVehicleMutation = useUpdateVehicle()
  const deleteVehicleMutation = useDeleteVehicle()

  // Loading states consolidados
  const isActionLoading = createVehicleMutation.isPending ||
    updateVehicleMutation.isPending ||
    deleteVehicleMutation.isPending

  // Função otimizada para mudanças de campo
  const handleFieldChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }, [])

  // Filtrar veículos (memoizado para performance)
  const filteredVehicles = useMemo(() => {
    let filtered = vehicles

    // Filtrar por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((vehicle: Vehicle) => vehicle.status === statusFilter)
    }

    // Filtrar por termo de busca
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter((vehicle: Vehicle) =>
        vehicle.brand.toLowerCase().includes(term) ||
        vehicle.model.toLowerCase().includes(term) ||
        vehicle.licensePlate.toLowerCase().includes(term) ||
        vehicle.color.toLowerCase().includes(term)
      )
    }

    // Filtrar por data de entrada (de)
    if (dateFromFilter) {
      filtered = filtered.filter((vehicle: Vehicle) => {
        const vehicleDate = new Date(vehicle.purchaseDate || new Date())
        const filterDate = new Date(dateFromFilter)
        return vehicleDate >= filterDate
      })
    }

    // Filtrar por data de entrada (até)
    if (dateToFilter) {
      filtered = filtered.filter((vehicle: Vehicle) => {
        const vehicleDate = new Date(vehicle.purchaseDate || new Date())
        const filterDate = new Date(dateToFilter)
        return vehicleDate <= filterDate
      })
    }

    return filtered
  }, [vehicles, statusFilter, searchTerm, dateFromFilter, dateToFilter])

  // Handlers para ações
  const handleEdit = useCallback((vehicle: Vehicle) => {
    if (isActionLoading) return

    setEditingVehicle(vehicle)
    setFormData({
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year.toString(),
      licensePlate: vehicle.licensePlate,
      color: vehicle.color,
      chassis: vehicle.chassis,
      fuelType: vehicle.fuelType,
      mileage: vehicle.mileage?.toString() || '',
      purchasePrice: vehicle.purchasePrice.toString(),
      salePrice: vehicle.salePrice?.toString() || '',
      purchaseDate: vehicle.purchaseDate ? new Date(vehicle.purchaseDate).toISOString().split('T')[0] : '',
      status: vehicle.status,
      isActive: vehicle.isActive
    })
    setIsEditDialogOpen(true)
  }, [isActionLoading])

  const handleAdd = useCallback(() => {
    if (isActionLoading) return

    setEditingVehicle(null)
    setFormData({
      brand: '',
      model: '',
      year: '',
      licensePlate: '',
      color: '',
      chassis: '',
      fuelType: 'GASOLINE',
      mileage: '',
      purchasePrice: '',
      salePrice: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      status: 'AVAILABLE',
      isActive: true
    })
    setIsAddDialogOpen(true)
  }, [isActionLoading])

  const handleSave = useCallback(async () => {
    if (isActionLoading) return

    const vehicleData = {
      brand: formData.brand,
      model: formData.model,
      year: parseInt(formData.year),
      licensePlate: formData.licensePlate.toUpperCase(),
      color: formData.color,
      chassis: formData.chassis.toUpperCase(),
      fuelType: formData.fuelType as Vehicle['fuelType'],
      mileage: formData.mileage ? parseInt(formData.mileage) : 0,
      purchasePrice: parseFloat(formData.purchasePrice),
      salePrice: formData.salePrice ? parseFloat(formData.salePrice) : undefined,
      purchaseDate: new Date(formData.purchaseDate),
      status: formData.status as Vehicle['status'],
      isActive: formData.isActive
    }

    try {
      if (editingVehicle) {
        await updateVehicleMutation.mutateAsync({ id: editingVehicle.id, data: vehicleData })
      } else {
        await createVehicleMutation.mutateAsync(vehicleData)
      }

      // Fechar dialogs
      setIsEditDialogOpen(false)
      setIsAddDialogOpen(false)

    } catch (error) {
      // Erros são tratados pelos hooks do React Query
      console.error('Erro ao salvar veículo:', error)
    }
  }, [isActionLoading, formData, editingVehicle, updateVehicleMutation, createVehicleMutation])

  const requestDeleteVehicle = useCallback(
    (vehicle: Vehicle) => {
      if (isActionLoading) return
      setVehicleToDelete(vehicle)
      setDeleteDialogOpen(true)
    },
    [isActionLoading],
  )

  const confirmDeleteVehicle = useCallback(async () => {
    if (!vehicleToDelete) return
    try {
      await deleteVehicleMutation.mutateAsync(vehicleToDelete.id)
      setDeleteDialogOpen(false)
      setVehicleToDelete(null)
    } catch (error) {
      console.error("Erro ao excluir veículo:", error)
    }
  }, [vehicleToDelete, deleteVehicleMutation])

  // Handlers para filtros
  const handleClearFilters = useCallback(() => {
    setStatusFilter('all')
    setSearchTerm('')
    setDateFromFilter('')
    setDateToFilter('')
    announceToScreenReader('Filtros limpos')
  }, [])

  if (isLoading) {
    return <VehiclesGridSkeleton />
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <PageHeader
        title="Gestão de Veículos"
        description="Gerencie o estoque de veículos da sua loja"
      >
        <Button onClick={handleAdd} disabled={isActionLoading}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Veículo
        </Button>
      </PageHeader>

      {/* Filtros */}
      <VehicleFilters
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        dateFromFilter={dateFromFilter}
        dateToFilter={dateToFilter}
        totalCount={vehicles.length}
        filteredCount={filteredVehicles.length}
        onSearchChange={setSearchTerm}
        onStatusChange={setStatusFilter}
        onDateFromChange={setDateFromFilter}
        onDateToChange={setDateToFilter}
        onClearFilters={handleClearFilters}
      />

      {/* Error state */}
      {error ? (
        <ErrorBanner>
          Erro ao carregar veículos: {error.message}
        </ErrorBanner>
      ) : null}

      {/* Empty state */}
      {filteredVehicles.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {vehicles.length === 0 ? 'Nenhum veículo encontrado' : 'Nenhum veículo corresponde aos filtros'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {vehicles.length === 0 ?
                  'Comece adicionando seu primeiro veículo ao estoque.' :
                  'Tente ajustar os filtros para encontrar o que procura.'}
              </p>
              {vehicles.length === 0 && (
                <Button onClick={handleAdd} disabled={isActionLoading}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Primeiro Veículo
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Grid de veículos */
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 stagger-animation">
          {filteredVehicles.map((vehicle: Vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              onEdit={handleEdit}
              onDelete={requestDeleteVehicle}
              isDeleting={deleteVehicleMutation.isPending}
              isActionLoading={isActionLoading}
            />
          ))}
        </div>
      )}

      {/* Dialog para Editar Veículo */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Veículo</DialogTitle>
            <DialogDescription>
              Edite as informações do veículo {editingVehicle?.brand} {editingVehicle?.model}.
            </DialogDescription>
          </DialogHeader>
          <VehicleForm
            formData={formData}
            onFieldChange={handleFieldChange}
            vehicles={vehicles}
            editingVehicle={editingVehicle}
          />
          <DialogFooter>
            <Button
              variant="cancel"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isActionLoading}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isActionLoading}>
              {isActionLoading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para Adicionar Veículo */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Veículo</DialogTitle>
            <DialogDescription>
              Preencha as informações do novo veículo.
            </DialogDescription>
          </DialogHeader>
          <VehicleForm
            formData={formData}
            onFieldChange={handleFieldChange}
            vehicles={vehicles}
            editingVehicle={null}
          />
          <DialogFooter>
            <Button
              variant="cancel"
              onClick={() => setIsAddDialogOpen(false)}
              disabled={isActionLoading}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isActionLoading}>
              {isActionLoading ? 'Adicionando...' : 'Adicionar Veículo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDestructiveDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open)
          if (!open) setVehicleToDelete(null)
        }}
        title="Excluir veículo"
        description={
          vehicleToDelete
            ? `Tem certeza que deseja excluir o veículo ${vehicleToDelete.brand} ${vehicleToDelete.model}? Esta ação não pode ser desfeita.`
            : ""
        }
        onConfirm={confirmDeleteVehicle}
        isPending={deleteVehicleMutation.isPending}
      />
    </div>
  )
} 