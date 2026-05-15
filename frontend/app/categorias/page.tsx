"use client"

import { PageHeader } from "@/components/layout/page-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { Category, CategoryService } from "@/lib/services/category.service"
import { Plus, Tags } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

const svc = new CategoryService()

export default function CategoriasPage() {
  const { toast } = useToast()
  const [rows, setRows] = useState<Category[]>([])
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [desc, setDesc] = useState("")

  const load = useCallback(async () => {
    try {
      const data = await svc.getAll()
      setRows(Array.isArray(data) ? data : [])
    } catch {
      toast({
        title: "Acesso negado ou erro",
        description: "Apenas administradores podem gerenciar categorias.",
        variant: "destructive",
      })
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  async function save() {
    try {
      await svc.create({ name: name.trim(), description: desc.trim() || undefined })
      toast({ title: "Categoria criada" })
      setOpen(false)
      setName("")
      setDesc("")
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
        title="Categorias"
        description="Disponível para o perfil administrador."
        icon={<Tags />}
      >
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Nova categoria
        </Button>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Lista</CardTitle>
          <CardDescription>Nome único por empresa.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>{c.description ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova categoria</DialogTitle>
          </DialogHeader>
          <Input placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Descrição (opcional)" value={desc} onChange={(e) => setDesc(e.target.value)} />
          <DialogFooter>
            <Button variant="cancel" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={!name.trim()}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
