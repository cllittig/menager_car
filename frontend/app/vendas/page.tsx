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
import { useToast } from "@/components/ui/use-toast"
import { useCurrency } from "@/hooks/use-currency"
import { getApiErrorMessage } from "@/lib/http/error-guards"
import { Client, ClientService } from "@/lib/services/client.service"
import { CreateSaleDto, Sale, SalesService } from "@/lib/services/sales.service"
import { type Vehicle, VehiclesApplicationService as VehicleService } from "@/lib/vehicles"
import { formatCPF, validatePrice } from "@/lib/validations"
import { DollarSign, Edit, Plus, Search, Trash2 } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"

export default function VendasPage() {
  const { formatMoney } = useCurrency()
  const [sales, setSales] = useState<Sale[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingSale, setEditingSale] = useState<Sale | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [deletingSaleId, setDeletingSaleId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [periodStart, setPeriodStart] = useState<string>('')
  const [periodEnd, setPeriodEnd] = useState<string>('')
  const { toast } = useToast()


  const [formData, setFormData] = useState({
    vehicleId: '',
    clientId: '',
    amount: '',
    saleDate: new Date().toISOString().split('T')[0] 
  })

  const salesService = useMemo(() => new SalesService(), [])
  const vehicleService = useMemo(() => new VehicleService(), [])
  const clientService = useMemo(() => new ClientService(), [])

  const loadInitialData = useCallback(async () => {
    try {
      setError(null)

      const [salesData, vehiclesData, clientsData] = await Promise.all([
        salesService.getAll(),
        vehicleService.getAll(),
        clientService.getAll()
      ])

      setSales(salesData)
      setVehicles(vehiclesData.filter((v: Vehicle) => !v.deletedAt)) 
      setClients(clientsData.filter((c: Client) => !c.deletedAt)) 
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      setError('Erro ao carregar dados. Tente novamente.')
      setSales([])
      setVehicles([])
      setClients([])
    } finally {
      setLoading(false)
    }
  }, [salesService, vehicleService, clientService])

  useEffect(() => {
    void loadInitialData()
  }, [loadInitialData])

  const handleFieldChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }, [])

  const handleAdd = useCallback(() => {
    if (actionLoading) return

    setEditingSale(null)
    setFormData({
      vehicleId: '',
      clientId: '',
      amount: '',
      saleDate: new Date().toISOString().split('T')[0]
    })
    setIsAddDialogOpen(true)
  }, [actionLoading])

  const handleEdit = useCallback((sale: Sale) => {
    if (actionLoading) return

    setEditingSale(sale)


    const getSafeDate = (dateValue: string | Date | undefined | null): string => {
      if (!dateValue) return new Date().toISOString().split('T')[0]

      const date = new Date(dateValue)
      if (isNaN(date.getTime())) {

        return new Date().toISOString().split('T')[0]
      }

      return date.toISOString().split('T')[0]
    }

    setFormData({
      vehicleId: sale.vehicleId,
      clientId: sale.clientId,
      amount: sale.amount.toString(),
      saleDate: getSafeDate(sale.vehicle?.saleDate)
    })
    setIsEditDialogOpen(true)
  }, [actionLoading])

  const handleSave = useCallback(async () => {
    if (actionLoading) return


    const requiredFields = {
      vehicleId: 'Veículo',
      clientId: 'Cliente',
      amount: 'Valor',
      saleDate: 'Data da Venda'
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

    // Validação do valor
    const priceValidation = validatePrice(formData.amount, 'Valor da venda')
    if (!priceValidation.isValid) {
      toast({
        title: "Valor inválido",
        description: priceValidation.message,
        variant: "destructive",
      })
      return
    }

    try {
      setActionLoading(true)

      const saleData: CreateSaleDto = {
        vehicleId: formData.vehicleId,
        clientId: formData.clientId,
        amount: parseFloat(formData.amount),
        saleDate: formData.saleDate
      }

      if (editingSale) {
        await salesService.update(editingSale.id, saleData)
        toast({
          title: "Venda atualizada",
          description: "Venda foi atualizada com sucesso.",
        })
      } else {
        await salesService.create(saleData)
        toast({
          title: "Venda registrada",
          description: "Nova venda foi registrada no sistema.",
        })
      }

      await Promise.all([
        loadInitialData(),
        new Promise(resolve => {
          setIsEditDialogOpen(false)
          setIsAddDialogOpen(false)
          resolve(void 0)
        })
      ])
    } catch (error: unknown) {
      const errorMessage = getApiErrorMessage(
        error,
        "Erro ao salvar venda. Tente novamente.",
      )
      toast({
        title: "Erro ao salvar",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }, [actionLoading, formData, editingSale, salesService, toast, loadInitialData])

  const requestDeleteSale = useCallback(
    (sale: Sale) => {
      if (actionLoading || deletingSaleId === sale.id) return
      setSaleToDelete(sale)
      setDeleteDialogOpen(true)
    },
    [actionLoading, deletingSaleId],
  )

  const confirmDeleteSale = useCallback(async () => {
    if (!saleToDelete) return
    const vehicleName = `${saleToDelete.vehicle?.brand || "Marca"} ${saleToDelete.vehicle?.model || "Modelo"}`
    try {
      setDeletingSaleId(saleToDelete.id)
      setActionLoading(true)

      await salesService.delete(saleToDelete.id)
      toast({
        title: "Venda excluída",
        description: `Venda do veículo ${vehicleName} foi removida do sistema.`,
      })

      await loadInitialData()
      setDeleteDialogOpen(false)
      setSaleToDelete(null)
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      const errorMessage =
        err.response?.data?.message || "Erro ao excluir venda. Tente novamente."
      toast({
        title: "Erro ao excluir",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
      setDeletingSaleId(null)
    }
  }, [saleToDelete, salesService, toast, loadInitialData])

  const filteredSales = useCallback(() => {
    let filtered = sales

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(sale => 
        sale.client?.name?.toLowerCase().includes(term) ||
        sale.vehicle?.brand?.toLowerCase().includes(term) ||
        sale.vehicle?.model?.toLowerCase().includes(term) ||
        sale.vehicle?.licensePlate?.toLowerCase().includes(term) ||
        sale.client?.cpf?.includes(term.replace(/\D/g, ''))
      )
    }

    if (periodStart.trim()) {
      const start = new Date(periodStart)
      start.setHours(0, 0, 0, 0)
      filtered = filtered.filter((sale) => {
        const raw = sale.saleDate
        if (!raw) return false
        return new Date(raw).getTime() >= start.getTime()
      })
    }

    if (periodEnd.trim()) {
      const end = new Date(periodEnd)
      end.setHours(23, 59, 59, 999)
      filtered = filtered.filter((sale) => {
        const raw = sale.saleDate
        if (!raw) return false
        return new Date(raw).getTime() <= end.getTime()
      })
    }

    return filtered
  }, [sales, searchTerm, periodStart, periodEnd])

  if (loading) {
    return <ListPageLoading label="Carregando vendas…" />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestão de Vendas"
        description="Gerencie as vendas e transações da sua loja"
      >
        <Button onClick={handleAdd} disabled={actionLoading}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Venda
        </Button>
      </PageHeader>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                  id="search-sales"
                  name="search"
                  placeholder="Buscar por veículo, cliente ou CPF..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
                <div className="grid gap-1">
                  <label htmlFor="sale-period-start" className="text-xs text-muted-foreground">Data inicial</label>
                  <Input
                    id="sale-period-start"
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    className="w-full sm:w-[11rem]"
                  />
                </div>
                <div className="grid gap-1">
                  <label htmlFor="sale-period-end" className="text-xs text-muted-foreground">Data final</label>
                  <Input
                    id="sale-period-end"
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className="w-full sm:w-[11rem]"
                  />
                </div>
              </div>
            </div>
            {sales.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Mostrando {filteredSales().length} de {sales.length} vendas
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {error ? <ErrorBanner>{error}</ErrorBanner> : null}

      {filteredSales().length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {sales.length === 0 ? 'Nenhuma venda encontrada' : 'Nenhuma venda corresponde aos filtros'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {error ? 'Não foi possível carregar as vendas.' : 
                 sales.length === 0 ? 'Comece registrando sua primeira venda.' :
                 'Tente ajustar os filtros para encontrar o que procura.'}
              </p>
              {sales.length === 0 && (
                <Button onClick={handleAdd} disabled={actionLoading}>
                  <Plus className="mr-2 h-4 w-4" />
                  Registrar Primeira Venda
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSales().map((sale) => (
            <Card key={sale.id} className="transition-shadow hover:shadow-elevation2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {sale.vehicle?.brand || 'Marca'} {sale.vehicle?.model || 'Modelo'}
                  </CardTitle>
                  <Badge variant="success">VENDIDO</Badge>
                </div>
                <CardDescription className="space-y-0.5">
                  <span className="block">
                    Cliente: {sale.client?.name || 'Cliente não informado'}
                  </span>
                  {sale.client?.cpf ? (
                    <span className="block text-xs">
                      CPF: {formatCPF(sale.client.cpf.replace(/\D/g, '').slice(0, 11))}
                    </span>
                  ) : null}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Valor:</span>
                    <span className="font-semibold text-lg">
                      {formatMoney(sale.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Placa:</span>
                    <span>{sale.vehicle?.licensePlate || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data da Venda:</span>
                    <span>{sale.vehicle?.saleDate ? new Date(sale.vehicle.saleDate).toLocaleDateString('pt-BR') : 'Data não informada'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">CPF Cliente:</span>
                    <span>{sale.client?.cpf ? sale.client.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : 'N/A'}</span>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEdit(sale)}
                    disabled={actionLoading}
                    title="Editar venda"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-destructive hover:text-destructive"
                    onClick={() => requestDeleteSale(sale)}
                    disabled={actionLoading || deletingSaleId === sale.id}
                    title="Excluir venda"
                  >
                    {deletingSaleId === sale.id ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-destructive" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog para Adicionar Venda */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Nova Venda</DialogTitle>
            <DialogDescription>
              Registre uma nova venda no sistema
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="vehicle">Veículo</Label>
              <Select value={formData.vehicleId} onValueChange={(value) => handleFieldChange('vehicleId', value)}>
                <SelectTrigger id="vehicle" name="vehicle">
                  <SelectValue placeholder="Selecione um veículo" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.brand || 'Marca'} {vehicle.model || 'Modelo'} - {vehicle.licensePlate || 'Sem placa'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="client">Cliente</Label>
              <Select value={formData.clientId} onValueChange={(value) => handleFieldChange('clientId', value)}>
                <SelectTrigger id="client" name="client">
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name || 'Nome não informado'} - {client.cpf ? client.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : 'CPF não informado'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="amount">Valor da Venda (R$)</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) => handleFieldChange('amount', e.target.value)}
                placeholder="Ex: 25000.00"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="saleDate">Data da Venda</Label>
              <Input
                id="saleDate"
                name="saleDate"
                type="date"
                value={formData.saleDate}
                onChange={(e) => handleFieldChange('saleDate', e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="cancel" onClick={() => setIsAddDialogOpen(false)} disabled={actionLoading}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={actionLoading}>
              {actionLoading ? 'Salvando...' : 'Registrar Venda'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para Editar Venda */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Venda</DialogTitle>
            <DialogDescription>
              Atualize os dados da venda
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
                      {vehicle.brand || 'Marca'} {vehicle.model || 'Modelo'} - {vehicle.licensePlate || 'Sem placa'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="client-edit">Cliente</Label>
              <Select value={formData.clientId} onValueChange={(value) => handleFieldChange('clientId', value)}>
                <SelectTrigger id="client-edit" name="client-edit">
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name || 'Nome não informado'} - {client.cpf ? client.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : 'CPF não informado'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="amount-edit">Valor da Venda (R$)</Label>
              <Input
                id="amount-edit"
                name="amount-edit"
                type="number"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) => handleFieldChange('amount', e.target.value)}
                placeholder="Ex: 25000.00"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="saleDate-edit">Data da Venda</Label>
              <Input
                id="saleDate-edit"
                name="saleDate-edit"
                type="date"
                value={formData.saleDate}
                onChange={(e) => handleFieldChange('saleDate', e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="cancel" onClick={() => setIsEditDialogOpen(false)} disabled={actionLoading}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={actionLoading}>
              {actionLoading ? 'Salvando...' : 'Atualizar Venda'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDestructiveDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open)
          if (!open) setSaleToDelete(null)
        }}
        title="Excluir venda"
        description={
          saleToDelete
            ? `Tem certeza que deseja excluir a venda do veículo ${saleToDelete.vehicle?.brand || "Marca"} ${saleToDelete.vehicle?.model || "Modelo"}? Esta ação não pode ser desfeita.`
            : ""
        }
        onConfirm={confirmDeleteSale}
        isPending={Boolean(deletingSaleId && saleToDelete && deletingSaleId === saleToDelete.id)}
      />
    </div>
  )
} 