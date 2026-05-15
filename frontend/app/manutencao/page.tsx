"use client"

import { ErrorBanner, ListPageLoading, PageHeader } from "@/components/layout/page-shell"
import { ConfirmDestructiveDialog } from "@/components/confirm-destructive-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { dashboardKeys } from "@/lib/dashboard"
import { useVehicles } from "@/lib/hooks/use-vehicles"
import { getApiErrorMessage } from "@/lib/http/error-guards"
import {
  CreateMaintenanceDto,
  Maintenance,
  MaintenanceService,
  maintenanceKeys,
  useMaintenanceList,
} from "@/lib/services/maintenance.service"
import { type Vehicle } from "@/lib/vehicles"
import { useQueryClient } from "@tanstack/react-query"
import { validatePrice } from "@/lib/validations"
import type { ComponentProps } from "react"
import {
  CheckCircle2,
  Clock,
  Edit,
  PlayCircle,
  Plus,
  Trash2,
  Wrench,
  XCircle,
  type LucideIcon,
} from "lucide-react"
import { useCallback, useMemo, useState } from "react"

function maintenanceStatusUi(status: string): {
  Icon: LucideIcon
  label: string
  variant: NonNullable<ComponentProps<typeof Badge>["variant"]>
} {
  switch (status) {
    case "COMPLETED":
      return { Icon: CheckCircle2, label: "Concluída", variant: "success" }
    case "IN_PROGRESS":
      return { Icon: PlayCircle, label: "Em andamento", variant: "info" }
    case "PENDING":
      return { Icon: Clock, label: "Pendente", variant: "warning" }
    case "CANCELLED":
      return { Icon: XCircle, label: "Cancelada", variant: "secondary" }
    default:
      return { Icon: Wrench, label: status, variant: "outline" }
  }
}

type MaintenanceFormStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"

function isMaintenanceFormStatus(value: string): value is MaintenanceFormStatus {
  return (
    value === "PENDING" ||
    value === "IN_PROGRESS" ||
    value === "COMPLETED" ||
    value === "CANCELLED"
  )
}

export default function ManutencaoPage() {
  const queryClient = useQueryClient()
  const { data: maintenances = [], isLoading: loadingM, isError: errM } = useMaintenanceList()
  const { data: vehiclesRaw = [], isLoading: loadingV, isError: errV } = useVehicles()
  const vehicles = useMemo(
    () => vehiclesRaw.filter((v: Vehicle) => !v.deletedAt),
    [vehiclesRaw],
  )
  const loading = loadingM || loadingV
  const error = errM || errV ? "Erro ao carregar dados. Tente novamente." : null
  const [editingMaintenance, setEditingMaintenance] = useState<Maintenance | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [deletingMaintenanceId, setDeletingMaintenanceId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [maintenanceToDelete, setMaintenanceToDelete] = useState<Maintenance | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const { toast } = useToast()


  const [formData, setFormData] = useState({
    vehicleId: '',
    description: '',
    cost: '',
    status: 'PENDING' as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED',
    mechanic: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: ''
  })

  const maintenanceService = useMemo(() => new MaintenanceService(), [])

  const handleFieldChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }, [])

  const handleAdd = useCallback(() => {
    if (actionLoading) return

    setEditingMaintenance(null)
    setFormData({
      vehicleId: '',
      description: '',
      cost: '',
      status: 'PENDING',
      mechanic: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: ''
    })
    setIsAddDialogOpen(true)
  }, [actionLoading])

  const handleEdit = useCallback((maintenance: Maintenance) => {
    if (actionLoading) return

    setEditingMaintenance(maintenance)
    setFormData({
      vehicleId: maintenance.vehicleId,
      description: maintenance.description,
      cost: maintenance.cost.toString(),
      status: maintenance.status,
      mechanic: maintenance.mechanic,
      startDate: new Date(maintenance.startDate).toISOString().split('T')[0],
      endDate: maintenance.endDate ? new Date(maintenance.endDate).toISOString().split('T')[0] : ''
    })
    setIsEditDialogOpen(true)
  }, [actionLoading])

  const handleSave = useCallback(async () => {
    if (actionLoading) return


    const requiredFields = {
      vehicleId: 'Veículo',
      description: 'Descrição',
      cost: 'Custo',
      mechanic: 'Mecânico',
      startDate: 'Data de Início'
    }

    const missingFields = Object.entries(requiredFields)
      .filter(([key]) => !formData[key as keyof typeof formData])
      .map(([, label]) => label)

    if (missingFields.length > 0) {
      toast({
        title: "Campos obrigatórios",
        description: `Preencha: ${missingFields.join(', ')}`,
        variant: "destructive",
      })
      return
    }

    // Validação do custo
    const costValidation = validatePrice(formData.cost, 'Custo da manutenção')
    if (!costValidation.isValid) {
      toast({
        title: "Custo inválido",
        description: costValidation.message,
        variant: "destructive",
      })
      return
    }

    try {
      setActionLoading(true)

      const maintenanceData: CreateMaintenanceDto = {
        vehicleId: formData.vehicleId,
        description: formData.description,
        cost: parseFloat(formData.cost),
        status: formData.status,
        mechanic: formData.mechanic,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined
      }

      if (editingMaintenance) {
        await maintenanceService.update(editingMaintenance.id, maintenanceData)
        toast({
          title: "Manutenção atualizada",
          description: "Manutenção foi atualizada com sucesso.",
        })
      } else {
        await maintenanceService.create(maintenanceData)
        toast({
          title: "Manutenção registrada",
          description: "Nova manutenção foi registrada no sistema.",
        })
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: maintenanceKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: dashboardKeys.all }),
      ])
      setIsEditDialogOpen(false)
      setIsAddDialogOpen(false)
    } catch (error: unknown) {
      const errorMessage = getApiErrorMessage(
        error,
        "Erro ao salvar manutenção. Tente novamente.",
      )
      toast({
        title: "Erro ao salvar",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }, [actionLoading, formData, editingMaintenance, maintenanceService, queryClient, toast])

  const requestDeleteMaintenance = useCallback(
    (maintenance: Maintenance) => {
      if (actionLoading || deletingMaintenanceId === maintenance.id) return
      setMaintenanceToDelete(maintenance)
      setDeleteDialogOpen(true)
    },
    [actionLoading, deletingMaintenanceId],
  )

  const confirmDeleteMaintenance = useCallback(async () => {
    if (!maintenanceToDelete) return
    const vehicleName = `${maintenanceToDelete.vehicle.brand} ${maintenanceToDelete.vehicle.model}`
    try {
      setDeletingMaintenanceId(maintenanceToDelete.id)
      setActionLoading(true)

      await maintenanceService.delete(maintenanceToDelete.id)
      toast({
        title: "Manutenção excluída",
        description: `Manutenção do veículo ${vehicleName} foi removida do sistema.`,
      })

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: maintenanceKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: dashboardKeys.all }),
      ])
      setDeleteDialogOpen(false)
      setMaintenanceToDelete(null)
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      const errorMessage =
        err.response?.data?.message || "Erro ao excluir manutenção. Tente novamente."
      toast({
        title: "Erro ao excluir",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
      setDeletingMaintenanceId(null)
    }
  }, [maintenanceToDelete, maintenanceService, queryClient, toast])

  // Filtrar manutenções baseado no termo e status
  const filteredMaintenances = useCallback(() => {
    let filtered = maintenances

    // Filtrar por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(maintenance => maintenance.status === statusFilter)
    }

    // Filtrar por termo de busca
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(maintenance => 
        maintenance.vehicle.brand.toLowerCase().includes(term) ||
        maintenance.vehicle.model.toLowerCase().includes(term) ||
        maintenance.vehicle.licensePlate.toLowerCase().includes(term) ||
        maintenance.mechanic.toLowerCase().includes(term) ||
        maintenance.description.toLowerCase().includes(term)
      )
    }

    return filtered
  }, [maintenances, statusFilter, searchTerm])

  if (loading) {
    return <ListPageLoading label="Carregando manutenções…" />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestão de Manutenção"
        description="Gerencie as manutenções e reparos dos veículos"
      >
        <Button onClick={handleAdd} disabled={actionLoading}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Manutenção
        </Button>
      </PageHeader>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="search-maintenances" className="text-sm font-medium">Buscar manutenções</label>
              <Input
                id="search-maintenances"
                name="search-maintenances"
                placeholder="Buscar por veículo, placa, mecânico ou descrição..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="w-full sm:w-48">
              <label htmlFor="status-filter" className="text-sm font-medium">Filtrar por status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter" name="status-filter" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="PENDING">Pendente</SelectItem>
                  <SelectItem value="IN_PROGRESS">Em Andamento</SelectItem>
                  <SelectItem value="COMPLETED">Concluída</SelectItem>
                  <SelectItem value="CANCELLED">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {maintenances.length > 0 && (
              <div className="text-sm text-muted-foreground mt-auto">
                Mostrando {filteredMaintenances().length} de {maintenances.length} manutenções
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {error ? <ErrorBanner>{error}</ErrorBanner> : null}

      {filteredMaintenances().length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {maintenances.length === 0 ? 'Nenhuma manutenção encontrada' : 'Nenhuma manutenção corresponde aos filtros'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {error ? 'Não foi possível carregar as manutenções.' : 
                 maintenances.length === 0 ? 'Comece registrando sua primeira manutenção.' :
                 'Tente ajustar os filtros para encontrar o que procura.'}
              </p>
              {maintenances.length === 0 && (
                <Button onClick={handleAdd} disabled={actionLoading}>
                  <Plus className="mr-2 h-4 w-4" />
                  Registrar Primeira Manutenção
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredMaintenances().map((maintenance) => {
            const ms = maintenanceStatusUi(maintenance.status)
            const MsIcon = ms.Icon
            return (
            <Card key={maintenance.id} className="transition-shadow hover:shadow-elevation2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {maintenance.vehicle.brand} {maintenance.vehicle.model}
                  </CardTitle>
                  <Badge variant={ms.variant}>
                    <MsIcon className="shrink-0" aria-hidden />
                    {ms.label}
                  </Badge>
                </div>
                <CardDescription>
                  Placa: {maintenance.vehicle.licensePlate}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="min-w-0 text-sm">
                    <p className="text-xs font-medium text-muted-foreground">Descrição</p>
                    <p
                      className="mt-1 text-sm leading-relaxed text-foreground"
                      title={maintenance.description}
                    >
                      {maintenance.description}
                    </p>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mecânico:</span>
                    <span>{maintenance.mechanic}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Custo:</span>
                    <span className="font-semibold">
                      {new Intl.NumberFormat('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL' 
                      }).format(maintenance.cost)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Início:</span>
                    <span>{new Date(maintenance.startDate).toLocaleDateString('pt-BR')}</span>
                  </div>
                  {maintenance.endDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fim:</span>
                      <span>{new Date(maintenance.endDate).toLocaleDateString('pt-BR')}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEdit(maintenance)}
                    disabled={actionLoading}
                    title="Editar manutenção"
                    aria-label={`Editar manutenção ${maintenance.vehicle.brand} ${maintenance.vehicle.model}`}
                    className="min-h-11 min-w-11 shrink-0 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="min-h-11 min-w-11 shrink-0 p-0 text-destructive hover:text-destructive"
                    onClick={() => requestDeleteMaintenance(maintenance)}
                    disabled={actionLoading || deletingMaintenanceId === maintenance.id}
                    title="Excluir manutenção"
                    aria-label={`Excluir manutenção ${maintenance.vehicle.brand} ${maintenance.vehicle.model}`}
                  >
                    {deletingMaintenanceId === maintenance.id ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-destructive" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}

      {/* Dialog para Adicionar Manutenção */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Nova Manutenção</DialogTitle>
            <DialogDescription>
              Registre uma nova manutenção no sistema
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="vehicle-add">Veículo</Label>
              <Select value={formData.vehicleId} onValueChange={(value) => handleFieldChange('vehicleId', value)}>
                <SelectTrigger id="vehicle-add" name="vehicle-add">
                  <SelectValue placeholder="Selecione um veículo" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.brand} {vehicle.model} - {vehicle.licensePlate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description-add">Descrição</Label>
              <Textarea
                id="description-add"
                name="description-add"
                value={formData.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                placeholder="Descreva o serviço de manutenção..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="cost-add">Custo (R$)</Label>
                <Input
                  id="cost-add"
                  name="cost-add"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => handleFieldChange('cost', e.target.value)}
                  placeholder="Ex: 150.00"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status-add">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: string) => {
                    if (isMaintenanceFormStatus(value)) {
                      handleFieldChange("status", value)
                    }
                  }}
                >
                  <SelectTrigger id="status-add" name="status-add">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pendente</SelectItem>
                    <SelectItem value="IN_PROGRESS">Em Andamento</SelectItem>
                    <SelectItem value="COMPLETED">Concluída</SelectItem>
                    <SelectItem value="CANCELLED">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="mechanic-add">Mecânico</Label>
              <Input
                id="mechanic-add"
                name="mechanic-add"
                value={formData.mechanic}
                onChange={(e) => handleFieldChange('mechanic', e.target.value)}
                placeholder="Nome do mecânico responsável"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate-add">Data de Início</Label>
                <Input
                  id="startDate-add"
                  name="startDate-add"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleFieldChange('startDate', e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="endDate-add">Data de Fim (opcional)</Label>
                <Input
                  id="endDate-add"
                  name="endDate-add"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleFieldChange('endDate', e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="cancel" onClick={() => setIsAddDialogOpen(false)} disabled={actionLoading}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={actionLoading}>
              {actionLoading ? 'Salvando...' : 'Registrar Manutenção'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para Editar Manutenção */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Editar Manutenção</DialogTitle>
            <DialogDescription>
              Atualize os dados da manutenção
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="vehicle-edit">Veículo</Label>
              <Select value={formData.vehicleId} onValueChange={(value) => handleFieldChange('vehicleId', value)}>
                <SelectTrigger id="vehicle-edit" name="vehicle-edit">
                  <SelectValue placeholder="Selecione um veículo" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.brand} {vehicle.model} - {vehicle.licensePlate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description-edit">Descrição</Label>
              <Textarea
                id="description-edit"
                name="description-edit"
                value={formData.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                placeholder="Descreva o serviço de manutenção..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="cost-edit">Custo (R$)</Label>
                <Input
                  id="cost-edit"
                  name="cost-edit"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => handleFieldChange('cost', e.target.value)}
                  placeholder="Ex: 150.00"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status-edit">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: string) => {
                    if (isMaintenanceFormStatus(value)) {
                      handleFieldChange("status", value)
                    }
                  }}
                >
                  <SelectTrigger id="status-edit" name="status-edit">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pendente</SelectItem>
                    <SelectItem value="IN_PROGRESS">Em Andamento</SelectItem>
                    <SelectItem value="COMPLETED">Concluída</SelectItem>
                    <SelectItem value="CANCELLED">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="mechanic-edit">Mecânico</Label>
              <Input
                id="mechanic-edit"
                name="mechanic-edit"
                value={formData.mechanic}
                onChange={(e) => handleFieldChange('mechanic', e.target.value)}
                placeholder="Nome do mecânico responsável"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate-edit">Data de Início</Label>
                <Input
                  id="startDate-edit"
                  name="startDate-edit"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleFieldChange('startDate', e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="endDate-edit">Data de Fim (opcional)</Label>
                <Input
                  id="endDate-edit"
                  name="endDate-edit"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleFieldChange('endDate', e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="cancel" onClick={() => setIsEditDialogOpen(false)} disabled={actionLoading}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={actionLoading}>
              {actionLoading ? 'Salvando...' : 'Atualizar Manutenção'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDestructiveDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open)
          if (!open) setMaintenanceToDelete(null)
        }}
        title="Excluir manutenção"
        description={
          maintenanceToDelete
            ? `Tem certeza que deseja excluir a manutenção do veículo ${maintenanceToDelete.vehicle.brand} ${maintenanceToDelete.vehicle.model}? Esta ação não pode ser desfeita.`
            : ""
        }
        onConfirm={confirmDeleteMaintenance}
        isPending={Boolean(
          deletingMaintenanceId &&
            maintenanceToDelete &&
            deletingMaintenanceId === maintenanceToDelete.id,
        )}
      />
    </div>
  )
} 