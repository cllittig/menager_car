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
import { getApiErrorMessage } from "@/lib/http/error-guards"
import { formatCPF } from "@/lib/validations"
import { AvailableTransaction, Contract, ContractService, CreateContractDto } from "@/lib/services/contract.service"
import { Download, FileText, Plus, Trash2 } from "lucide-react"
import type { ComponentProps } from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

function contractTypeBadgeVariant(
  type: string,
): NonNullable<ComponentProps<typeof Badge>["variant"]> {
  switch (type) {
    case "SALE":
      return "success"
    case "PURCHASE":
      return "info"
    case "MAINTENANCE":
      return "warning"
    default:
      return "secondary"
  }
}

type ContractTransactionType = "PURCHASE" | "SALE" | "MAINTENANCE"

function isContractTransactionType(value: string): value is ContractTransactionType {
  return value === "PURCHASE" || value === "SALE" || value === "MAINTENANCE"
}

export default function ContratosPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [deletingContractId, setDeletingContractId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [contractToDelete, setContractToDelete] = useState<Contract | null>(null)

  const [availableTransactions, setAvailableTransactions] = useState<AvailableTransaction[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(false)

  const [formData, setFormData] = useState({
    transactionId: '',
    transactionType: '' as 'PURCHASE' | 'SALE' | 'MAINTENANCE' | '',
    transactionAmount: '',
    file: null as File | null
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null)

  const contractService = useMemo(() => new ContractService(), [])
  const { toast } = useToast()

  const loadContracts = useCallback(async () => {
    try {
      setError(null)
      const data = await contractService.getAll()
      setContracts(data)
    } catch (error) {
      console.error('Erro ao carregar contratos:', error)
      setError('Erro ao carregar contratos. Tente novamente.')
      setContracts([])
    } finally {
      setLoading(false)
    }
  }, [contractService])

  const loadAvailableTransactions = useCallback(async () => {
    try {
      setLoadingTransactions(true)
      const data = await contractService.getAvailableTransactions()
      setAvailableTransactions(data)
    } catch (error) {
      console.error('Erro ao carregar transações disponíveis:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar transações disponíveis.",
        variant: "destructive",
      })
    } finally {
      setLoadingTransactions(false)
    }
  }, [contractService, toast])

  useEffect(() => {
    void loadContracts()
  }, [loadContracts])

  useEffect(() => {
    const f = formData.file
    if (!f || !f.type.startsWith("image/")) {
      setFilePreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(f)
    setFilePreviewUrl(url)
    return () => {
      URL.revokeObjectURL(url)
    }
  }, [formData.file])

  const canSubmitContract = useMemo(() => {
    const amount = parseFloat(formData.transactionAmount)
    return Boolean(
      formData.file &&
        formData.transactionId &&
        formData.transactionType &&
        !Number.isNaN(amount) &&
        amount > 0,
    )
  }, [
    formData.file,
    formData.transactionId,
    formData.transactionType,
    formData.transactionAmount,
  ])

  const handleFieldChange = useCallback((field: string, value: string | File | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }, [])

  const handleAdd = useCallback(async () => {
    if (actionLoading) return

    setFormData({
      transactionId: '',
      file: null,
      transactionType: 'SALE',
      transactionAmount: ''
    })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    setIsAddDialogOpen(true)


    await loadAvailableTransactions()
  }, [actionLoading, loadAvailableTransactions])

  const handleSave = useCallback(async () => {
    if (actionLoading) return


    if (!formData.file) {
      toast({
        title: "Arquivo obrigatório",
        description: "Selecione um arquivo PDF para fazer upload.",
        variant: "destructive",
      })
      return
    }

    if (!formData.transactionId) {
      toast({
        title: "Veículo obrigatório",
        description: "Selecione um veículo da lista.",
        variant: "destructive",
      })
      return
    }

    if (!formData.transactionType) {
      toast({
        title: "Tipo obrigatório",
        description: "Selecione o tipo do contrato.",
        variant: "destructive",
      })
      return
    }


    if (!formData.transactionAmount || parseFloat(formData.transactionAmount) <= 0) {
      toast({
        title: "Valor inválido",
        description: "Informe um valor válido.",
        variant: "destructive",
      })
      return
    }

    try {
      setActionLoading(true)

      const contractData: CreateContractDto = {
        transactionId: formData.transactionId,
        file: formData.file!,
        transactionType: formData.transactionType,
        transactionAmount: parseFloat(formData.transactionAmount)
      }

      await contractService.create(contractData)


      const selectedTransaction = availableTransactions.find(t => t.id === formData.transactionId)
      const vehicleInfo = selectedTransaction?.vehicle ? 
        `${selectedTransaction.vehicle.licensePlate}` : 
        'contrato'

      toast({
        title: "Contrato salvo",
        description: `Contrato vinculado ao veículo ${vehicleInfo}.`,
      })

      await Promise.all([
        loadContracts(),
        new Promise(resolve => {
          setIsAddDialogOpen(false)
          resolve(void 0)
        })
      ])
    } catch (error: unknown) {
      const errorMessage = getApiErrorMessage(
        error,
        "Erro ao salvar contrato. Tente novamente.",
      )
      toast({
        title: "Erro ao salvar",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }, [actionLoading, formData, contractService, toast, availableTransactions, loadContracts])

  const requestDeleteContract = useCallback(
    (contract: Contract) => {
      if (actionLoading || deletingContractId === contract.id) return
      setContractToDelete(contract)
      setDeleteDialogOpen(true)
    },
    [actionLoading, deletingContractId],
  )

  const confirmDeleteContract = useCallback(async () => {
    if (!contractToDelete) return
    try {
      setDeletingContractId(contractToDelete.id)
      setActionLoading(true)

      await contractService.delete(contractToDelete.id)
      toast({
        title: "Contrato excluído",
        description: `Contrato "${contractToDelete.fileName}" foi removido do sistema.`,
      })

      await loadContracts()
      setDeleteDialogOpen(false)
      setContractToDelete(null)
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      const errorMessage =
        err.response?.data?.message || "Erro ao excluir contrato. Tente novamente."
      toast({
        title: "Erro ao excluir",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
      setDeletingContractId(null)
    }
  }, [contractToDelete, contractService, toast, loadContracts])

  const handleDownload = useCallback(async (contract: Contract) => {
    if (actionLoading) return

    try {
      setActionLoading(true)
      const blob = await contractService.download(contract.id)

      // Criar URL para download
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = contract.fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Download iniciado",
        description: `Download do arquivo "${contract.fileName}" foi iniciado.`,
      })
    } catch (error: unknown) {
      const errorMessage = getApiErrorMessage(
        error,
        "Erro ao fazer download. Tente novamente.",
      )
      toast({
        title: "Erro no download",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }, [actionLoading, contractService, toast])

  const getTransactionTypeText = (type: string) => {
    switch (type) {
      case 'SALE': return 'Venda'
      case 'PURCHASE': return 'Compra'
      case 'MAINTENANCE': return 'Manutenção'
      default: return type
    }
  }

  // Filtrar contratos baseado no termo e tipo
  const filteredContracts = useCallback(() => {
    let filtered = contracts

    // Filtrar por tipo
    if (typeFilter !== 'all') {
      filtered = filtered.filter(contract => contract.transactionType === typeFilter)
    }

    // Filtrar por termo de busca
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(contract => 
        contract.fileName.toLowerCase().includes(term) ||
        contract.transactionId.toLowerCase().includes(term) ||
        contract.clientName?.toLowerCase().includes(term) ||
        contract.vehicleBrand?.toLowerCase().includes(term) ||
        contract.vehicleModel?.toLowerCase().includes(term)
      )
    }

    return filtered
  }, [contracts, typeFilter, searchTerm])

  if (loading) {
    return <ListPageLoading label="Carregando contratos…" />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contratos"
        description="Armazene e gerencie contratos vinculados aos veículos"
      >
        <Button onClick={handleAdd} disabled={actionLoading}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Contrato
        </Button>
      </PageHeader>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="search-contracts" className="text-sm font-medium">Buscar contratos</label>
              <Input
                id="search-contracts"
                placeholder="Buscar contratos..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="w-full sm:w-48">
              <label htmlFor="type-filter" className="text-sm font-medium">Filtrar por tipo</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger id="type-filter" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="SALE">Venda</SelectItem>
                  <SelectItem value="PURCHASE">Compra</SelectItem>
                  <SelectItem value="MAINTENANCE">Manutenção</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {contracts.length > 0 && (
              <div className="text-sm text-muted-foreground mt-auto">
                Mostrando {filteredContracts().length} de {contracts.length} contratos
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {error ? <ErrorBanner>{error}</ErrorBanner> : null}

      {filteredContracts().length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {contracts.length === 0 ? 'Nenhum contrato encontrado' : 'Nenhum contrato corresponde aos filtros'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {error ? 'Não foi possível carregar os contratos.' : 
                 contracts.length === 0 ? 'Comece adicionando seu primeiro contrato.' :
                 'Tente ajustar os filtros para encontrar o que procura.'}
              </p>
              {contracts.length === 0 && (
                <Button onClick={handleAdd} disabled={actionLoading}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Primeiro Contrato
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredContracts().map((contract) => (
            <Card key={contract.id} className="transition-shadow hover:shadow-elevation2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg truncate">
                    {contract.fileName}
                  </CardTitle>
                  <Badge variant={contractTypeBadgeVariant(contract.transactionType)}>
                    {getTransactionTypeText(contract.transactionType)}
                  </Badge>
                </div>
                <CardDescription>
                  {contract.vehicleBrand && contract.vehicleModel && (
                    <span className="block">{contract.vehicleBrand} {contract.vehicleModel}</span>
                  )}
                  {contract.clientName && (
                    <span className="block text-xs">Cliente: {contract.clientName}</span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Valor:</span>
                    <span className="font-semibold">
                      {new Intl.NumberFormat('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL' 
                      }).format(contract.transactionAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Upload:</span>
                    <span>{new Date(contract.uploadDate).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDownload(contract)}
                    disabled={actionLoading}
                    title="Baixar contrato"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => requestDeleteContract(contract)}
                    disabled={actionLoading || deletingContractId === contract.id}
                    title="Excluir contrato"
                  >
                    {deletingContractId === contract.id ? (
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

      {/* Dialog para Adicionar Contrato */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px] max-w-[95vw]">
          <DialogHeader>
            <DialogTitle>Novo Contrato</DialogTitle>
            <DialogDescription>
              Vincule um contrato ao veículo/cliente
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 min-w-0 max-w-full overflow-hidden">
            <div className="grid gap-2 min-w-0">
              <Label htmlFor="transactionSelect">Veículo e Cliente</Label>
              {loadingTransactions ? (
                <div className="flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-primary" />
                  <span>Carregando…</span>
                </div>
              ) : (
                <div className="w-full max-w-full">
                  <Select value={formData.transactionId} onValueChange={(value) => {
                    handleFieldChange('transactionId', value)
                    // Preencher automaticamente apenas o valor baseado na transação selecionada
                    const selectedTransaction = availableTransactions.find(t => t.id === value)
                    if (selectedTransaction) {
                      handleFieldChange('transactionAmount', selectedTransaction.amount.toString())
                    }
                  }}>
                    <SelectTrigger 
                      id="transactionSelect" 
                      className="w-full overflow-hidden text-ellipsis whitespace-nowrap"
                      style={{ minWidth: 0, maxWidth: '100%' }}
                    >
                      <SelectValue 
                        placeholder="Selecione veículo e cliente"
                        className="truncate w-full block max-w-full overflow-hidden text-ellipsis"
                      >
                        {formData.transactionId && (() => {
                          const selected = availableTransactions.find(t => t.id === formData.transactionId)
                          if (selected) {
                            const licensePlate = selected.vehicle?.licensePlate || 'S/Placa'
                            const vehicleName = `${selected.vehicle?.brand || ''} ${selected.vehicle?.model || ''}`.trim()
                            return `${licensePlate} - ${vehicleName}`
                          }
                          return null
                        })()}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="max-w-[400px]">
                      {availableTransactions.length === 0 ? (
                        <SelectItem value="" disabled>
                          Nenhum veículo disponível
                        </SelectItem>
                      ) : (
                        availableTransactions.map((transaction) => {
                          const date = new Date(transaction.createdAt).toLocaleDateString('pt-BR')
                          const licensePlate = transaction.vehicle?.licensePlate || 'S/Placa'
                          const clientName = transaction.client?.name || 'Cliente não informado'
                          const vehicleName = `${transaction.vehicle?.brand || ''} ${transaction.vehicle?.model || ''}`.trim()
                          const formattedAmount = new Intl.NumberFormat('pt-BR', { 
                            style: 'currency', 
                            currency: 'BRL' 
                          }).format(transaction.amount)

                          // Limitar comprimento dos textos
                          const shortVehicleName = vehicleName.length > 20 ? vehicleName.substring(0, 20) + '...' : vehicleName
                          const shortClientName = clientName.length > 25 ? clientName.substring(0, 25) + '...' : clientName

                          return (
                            <SelectItem key={transaction.id} value={transaction.id}>
                              <div className="flex flex-col gap-1 min-w-0 w-full max-w-[300px]">
                                <div className="font-medium truncate">
                                  {licensePlate} - {shortVehicleName}
                                </div>
                                <div className="text-sm text-muted-foreground truncate">
                                  {shortClientName}
                                </div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {date} • {formattedAmount}
                                </div>
                                {transaction.client?.cpf ? (
                                  <div className="text-xs text-muted-foreground truncate">
                                    CPF: {formatCPF(transaction.client.cpf.replace(/\D/g, "").slice(0, 11))}
                                  </div>
                                ) : null}
                              </div>
                            </SelectItem>
                          )
                        })
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="grid gap-2 min-w-0">
              <Label htmlFor="transactionType">Tipo do Contrato</Label>
              <Select
                value={formData.transactionType}
                onValueChange={(value: string) => {
                  if (isContractTransactionType(value)) {
                    handleFieldChange("transactionType", value)
                  }
                }}
              >
                <SelectTrigger style={{ minWidth: 0, maxWidth: '100%' }}>
                  <SelectValue placeholder="Tipo de contrato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SALE">Venda</SelectItem>
                  <SelectItem value="PURCHASE">Compra</SelectItem>
                  <SelectItem value="MAINTENANCE">Manutenção</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2 min-w-0">
              <Label htmlFor="transactionAmount">Valor (R$)</Label>
              <Input
                id="transactionAmount"
                type="number"
                min="0"
                step="0.01"
                value={formData.transactionAmount}
                onChange={(e) => handleFieldChange('transactionAmount', e.target.value)}
                placeholder="0,00"
                className="w-full"
                style={{ minWidth: 0, maxWidth: '100%' }}
              />
            </div>

            <div className="grid gap-2 min-w-0">
              <Label htmlFor="file">Arquivo do Contrato</Label>
              <Input
                id="file"
                type="file"
                ref={fileInputRef}
                accept=".pdf,.doc,.docx,.txt,image/png,image/jpeg,image/webp"
                onChange={(e) => handleFieldChange('file', e.target.files?.[0] || null)}
                className="w-full"
                style={{ minWidth: 0, maxWidth: '100%' }}
              />
              <p className="text-xs text-muted-foreground">
                Obrigatório: PDF, DOC, DOCX, TXT ou imagem (PNG/JPEG) para pré-visualização.
              </p>
              {formData.file ? (
                <div className="rounded-md border bg-muted/30 p-2 text-sm">
                  {filePreviewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- prévia local (blob:)
                    <img
                      src={filePreviewUrl}
                      alt="Pré-visualização do anexo"
                      className="max-h-40 w-full object-contain mx-auto"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                      <FileText className="h-8 w-8 shrink-0" aria-hidden />
                      <span className="truncate">{formData.file.name}</span>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
          <DialogFooter>
            <Button variant="cancel" onClick={() => setIsAddDialogOpen(false)} disabled={actionLoading}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={actionLoading || !canSubmitContract}
              title={
                !canSubmitContract
                  ? "Selecione a transação, tipo e valor e anexe o arquivo do contrato."
                  : undefined
              }
            >
              {actionLoading ? 'Salvando contrato...' : 'Salvar Contrato'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDestructiveDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open)
          if (!open) setContractToDelete(null)
        }}
        title="Excluir contrato"
        description={
          contractToDelete
            ? `Tem certeza que deseja excluir o contrato "${contractToDelete.fileName}"? Esta ação não pode ser desfeita.`
            : ""
        }
        onConfirm={confirmDeleteContract}
        isPending={Boolean(
          deletingContractId &&
            contractToDelete &&
            deletingContractId === contractToDelete.id,
        )}
      />
    </div>
  )
} 