"use client"

import { PageHeader } from "@/components/layout/page-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { Supplier, SupplierService } from "@/lib/services/supplier.service"
import { Plus, Truck } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

const svc = new SupplierService()

export default function FornecedoresPage() {
  const { toast } = useToast()
  const [rows, setRows] = useState<Supplier[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: "", email: "", phone: "", document: "" })

  const load = useCallback(async () => {
    try {
      const data = await svc.getAll()
      setRows(Array.isArray(data) ? data : [])
    } catch {
      toast({
        title: "Acesso negado ou erro",
        description: "Apenas administradores podem gerenciar fornecedores.",
        variant: "destructive",
      })
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  async function save() {
    try {
      await svc.create({
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        document: form.document.trim() || undefined,
      })
      toast({ title: "Fornecedor cadastrado" })
      setOpen(false)
      setForm({ name: "", email: "", phone: "", document: "" })
      load()
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "response" in e
          ? String((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Erro")
          : "Erro"
      toast({ title: "Falha", description: msg, variant: "destructive" })
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fornecedores"
        description="Disponível para o perfil administrador."
        icon={<Truck />}
      >
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Novo fornecedor
        </Button>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Lista</CardTitle>
          <CardDescription>Cadastro de parceiros para vínculo com produtos.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Telefone</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.name}</TableCell>
                  <TableCell>{s.email ?? "—"}</TableCell>
                  <TableCell>{s.phone ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo fornecedor</DialogTitle>
          </DialogHeader>
          <Input placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input placeholder="E-mail" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input placeholder="Telefone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input placeholder="CNPJ/CPF" value={form.document} onChange={(e) => setForm({ ...form, document: e.target.value })} />
          <DialogFooter>
            <Button variant="cancel" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={!form.name.trim()}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
