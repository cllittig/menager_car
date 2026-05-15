"use client"

import { ErrorBanner, PageHeader } from "@/components/layout/page-shell"
import { ConfirmDestructiveDialog } from "@/components/confirm-destructive-dialog"
import { ClientForm, type ClientFormState } from "@/components/clients/client-form"
import { ClientsGridSkeleton } from "@/components/clients/clients-grid-skeleton"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import type { Client } from "@/lib/clients"
import {
  useClients,
  useCreateClient,
  useDeleteClient,
  useUpdateClient,
} from "@/lib/hooks/use-clients"
import {
  checkClientUniqueness,
  validateCNH,
  validateCPF,
  validateEmail,
  validatePhone,
} from "@/lib/validations"
import { Edit, Mail, Phone, Plus, Trash2, Users } from "lucide-react"
import { useCallback, useMemo, useState } from "react"

export default function ClientesPage() {
  const { data: clients = [], isLoading, error, refetch } = useClients()
  const createClientMutation = useCreateClient()
  const updateClientMutation = useUpdateClient()
  const deleteClientMutation = useDeleteClient()

  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const { toast } = useToast()

  const [formData, setFormData] = useState<ClientFormState>({
    name: "",
    email: "",
    phone: "",
    cpf: "",
    cnh: "",
    address: "",
    birthDate: "",
  })

  const actionLoading =
    createClientMutation.isPending ||
    updateClientMutation.isPending ||
    deleteClientMutation.isPending

  const handleFieldChange = useCallback((field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }, [])

  const handleEdit = useCallback(
    (client: Client) => {
      if (actionLoading) return

      setEditingClient(client)
      setFormData({
        name: client.name || "",
        email: client.email || "",
        phone: client.phone || "",
        cpf: client.cpf || "",
        cnh: client.cnh || "",
        address: client.address || "",
        birthDate: client.birthDate
          ? new Date(client.birthDate).toISOString().split("T")[0]
          : "",
      })
      setIsEditDialogOpen(true)
    },
    [actionLoading],
  )

  const handleAdd = useCallback(() => {
    if (actionLoading) return

    setEditingClient(null)
    setFormData({
      name: "",
      email: "",
      phone: "",
      cpf: "",
      cnh: "",
      address: "",
      birthDate: "",
    })
    setIsAddDialogOpen(true)
  }, [actionLoading])

  const handleSave = useCallback(async () => {
    if (actionLoading) return

    const requiredFields = {
      name: "Nome",
      email: "Email",
      phone: "Telefone",
      cpf: "CPF",
    }

    const missingFields = Object.entries(requiredFields)
      .filter(([key]) => !formData[key as keyof ClientFormState])
      .map(([, label]) => label)

    if (missingFields.length > 0) {
      toast({
        title: "Campos obrigatórios",
        description: `Preencha: ${missingFields.join(", ")}`,
        variant: "destructive",
      })
      return
    }

    const validations = [
      validateEmail(formData.email),
      validatePhone(formData.phone),
      validateCPF(formData.cpf),
      ...(formData.cnh ? [validateCNH(formData.cnh)] : []),
    ]

    const invalidValidations = validations.filter((v) => !v.isValid)
    if (invalidValidations.length > 0) {
      toast({
        title: "Dados inválidos",
        description: invalidValidations[0].message,
        variant: "destructive",
      })
      return
    }

    const uniquenessCheck = await checkClientUniqueness(
      [
        { field: "email", value: formData.email, excludeId: editingClient?.id },
        {
          field: "phone",
          value: formData.phone.replace(/\D/g, ""),
          excludeId: editingClient?.id,
        },
        {
          field: "cpf",
          value: formData.cpf.replace(/\D/g, ""),
          excludeId: editingClient?.id,
        },
      ],
      clients,
    )

    if (!uniquenessCheck.isValid) {
      toast({
        title: "Dados duplicados",
        description: uniquenessCheck.messages.join(", "),
        variant: "destructive",
      })
      return
    }

    const clientData = {
      name: formData.name,
      email: formData.email.toLowerCase(),
      phone: formData.phone.replace(/\D/g, ""),
      cpf: formData.cpf.replace(/\D/g, ""),
      cnh: formData.cnh?.replace(/\D/g, "") || "",
      address: formData.address || "",
      birthDate: formData.birthDate ? new Date(formData.birthDate) : undefined,
    }

    try {
      if (editingClient) {
        await updateClientMutation.mutateAsync({
          id: editingClient.id,
          data: clientData,
        })
      } else {
        await createClientMutation.mutateAsync(
          clientData as Omit<Client, "id" | "createdAt" | "updatedAt">,
        )
      }
      setIsEditDialogOpen(false)
      setIsAddDialogOpen(false)
    } catch {
      /* toasts nos hooks */
    }
  }, [
    actionLoading,
    formData,
    editingClient,
    clients,
    toast,
    createClientMutation,
    updateClientMutation,
  ])

  const requestDeleteClient = useCallback(
    (client: Client) => {
      if (actionLoading || deleteClientMutation.isPending) return
      setClientToDelete(client)
      setDeleteDialogOpen(true)
    },
    [actionLoading, deleteClientMutation.isPending],
  )

  const confirmDeleteClient = useCallback(async () => {
    if (!clientToDelete) return
    try {
      await deleteClientMutation.mutateAsync(clientToDelete.id)
      setDeleteDialogOpen(false)
      setClientToDelete(null)
    } catch {
      /* toasts nos hooks */
    }
  }, [clientToDelete, deleteClientMutation])

  const formatCPFDisplay = useCallback((cpf: string | undefined | null) => {
    if (!cpf) return "N/A"
    const d = cpf.replace(/\D/g, "")
    if (d.length !== 11) return cpf
    return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
  }, [])

  const formatPhoneDisplay = useCallback((phone: string | undefined | null) => {
    if (!phone) return "N/A"
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
  }, [])

  const formatCNHDisplay = useCallback((cnh: string | undefined | null) => {
    if (!cnh) return "N/A"
    return cnh.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
  }, [])

  const formatBirthDate = useCallback((birthDate: Date | undefined | null) => {
    if (!birthDate) return "N/A"
    return new Date(birthDate).toLocaleDateString("pt-BR")
  }, [])

  const filteredClients = useMemo(() => {
    if (!searchTerm.trim()) {
      return clients
    }

    const term = searchTerm.toLowerCase().trim()

    return clients.filter((client) => {
      const name = (client.name || "").toLowerCase()
      const email = (client.email || "").toLowerCase()
      const phone = client.phone || ""
      const cpf = client.cpf || ""
      const cnh = client.cnh || ""
      const address = (client.address || "").toLowerCase()

      if (name.includes(term) || email.includes(term) || address.includes(term)) {
        return true
      }

      const numericTerm = term.replace(/\D/g, "")
      if (numericTerm.length > 0) {
        const phoneNumbers = phone.replace(/\D/g, "")
        const cpfNumbers = cpf.replace(/\D/g, "")
        const cnhNumbers = cnh.replace(/\D/g, "")

        if (
          phoneNumbers.includes(numericTerm) ||
          cpfNumbers.includes(numericTerm) ||
          cnhNumbers.includes(numericTerm)
        ) {
          return true
        }
      }

      if (phone.includes(term) || cpf.includes(term) || cnh.includes(term)) {
        return true
      }

      return false
    })
  }, [clients, searchTerm])

  if (isLoading) {
    return <ClientsGridSkeleton />
  }

  const errMessage =
    error instanceof Error
      ? error.message
      : "Erro ao carregar lista de clientes"

  return (
    <div className="space-y-6">
      <PageHeader title="Gestão de Clientes" description="Gerencie sua base de clientes">
        <Button onClick={handleAdd} disabled={actionLoading}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Cliente
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="search" className="text-sm font-medium">
                Buscar clientes
              </label>
              <Input
                id="search"
                name="search"
                placeholder="Buscar por nome, email, telefone, CPF, CNH ou endereço..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSearchTerm(e.target.value)
                }
                className="mt-1"
              />
            </div>
            {clients.length > 0 && (
              <div className="text-sm text-muted-foreground mt-auto">
                Mostrando {filteredClients.length} de {clients.length} clientes
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {error ? (
        <ErrorBanner>
          <div className="space-y-3">
            <p>{errMessage}</p>
            <Button variant="outline" size="sm" className="border-destructive/30" onClick={() => refetch()}>
              Tentar novamente
            </Button>
          </div>
        </ErrorBanner>
      ) : null}

      {filteredClients.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {clients.length === 0
                  ? "Nenhum cliente encontrado"
                  : "Nenhum cliente corresponde aos filtros"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {error
                  ? "Não foi possível carregar os clientes."
                  : clients.length === 0
                    ? "Comece adicionando seu primeiro cliente."
                    : "Tente ajustar os filtros para encontrar o que procura."}
              </p>
              {clients.length === 0 && !error && (
                <Button onClick={handleAdd} disabled={actionLoading}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Primeiro Cliente
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => (
            <Card
              key={client.id}
              className={`transition-shadow hover:shadow-elevation2 ${client.isActive === false ? "border-warning/40 opacity-80" : ""}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {client.name || "Nome não informado"}
                  </CardTitle>
                  {client.isActive === false && (
                    <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                      INATIVO
                    </span>
                  )}
                </div>
                <CardDescription>CPF: {formatCPFDisplay(client.cpf)}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{client.email || "Email não informado"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{formatPhoneDisplay(client.phone)}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">CNH:</span>
                    <span className="ml-2">{formatCNHDisplay(client.cnh)}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Data de Nascimento:</span>
                    <span className="ml-2">{formatBirthDate(client.birthDate)}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Endereço:</span>
                    <span className="ml-2">{client.address || "N/A"}</span>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(client)}
                    disabled={actionLoading}
                    title="Editar cliente"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => requestDeleteClient(client)}
                    disabled={actionLoading}
                    title="Excluir cliente"
                  >
                    {deleteClientMutation.isPending &&
                    deleteClientMutation.variables === client.id ? (
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

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>
              Edite as informações do cliente {editingClient?.name}.
            </DialogDescription>
          </DialogHeader>
          <ClientForm
            formData={formData}
            onFieldChange={handleFieldChange}
            clients={clients}
            editingClient={editingClient}
          />
          <DialogFooter>
            <Button
              variant="cancel"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={actionLoading}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={actionLoading}>
              {actionLoading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Cliente</DialogTitle>
            <DialogDescription>Preencha as informações do novo cliente.</DialogDescription>
          </DialogHeader>
          <ClientForm
            formData={formData}
            onFieldChange={handleFieldChange}
            clients={clients}
            editingClient={null}
          />
          <DialogFooter>
            <Button
              variant="cancel"
              onClick={() => setIsAddDialogOpen(false)}
              disabled={actionLoading}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={actionLoading}>
              {actionLoading ? "Adicionando..." : "Adicionar Cliente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDestructiveDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open)
          if (!open) setClientToDelete(null)
        }}
        title="Excluir cliente"
        description={
          clientToDelete
            ? `Tem certeza que deseja excluir o cliente ${clientToDelete.name}? Esta ação não pode ser desfeita.`
            : ""
        }
        onConfirm={confirmDeleteClient}
        isPending={deleteClientMutation.isPending}
      />
    </div>
  )
}
