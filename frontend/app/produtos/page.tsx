"use client"

import { PageHeader } from "@/components/layout/page-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { Product, ProductService } from "@/lib/services/product.service"
import { ArrowDownCircle, ArrowUpCircle, Package, Plus, RefreshCw } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

const productService = new ProductService()

export default function ProdutosPage() {
  const { toast } = useToast()
  const [items, setItems] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [openNew, setOpenNew] = useState(false)
  const [movProduct, setMovProduct] = useState<Product | null>(null)
  const [movType, setMovType] = useState<"IN" | "OUT">("IN")
  const [movQty, setMovQty] = useState("1")
  const [form, setForm] = useState({
    name: "",
    sku: "",
    quantityOnHand: "0",
    minStock: "0",
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await productService.getAll()
      setItems(Array.isArray(data) ? data : [])
    } catch {
      toast({ title: "Erro", description: "Não foi possível carregar produtos.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  async function handleCreate() {
    try {
      await productService.create({
        name: form.name.trim(),
        sku: form.sku.trim(),
        quantityOnHand: Math.max(0, parseInt(form.quantityOnHand, 10) || 0),
        minStock: Math.max(0, parseInt(form.minStock, 10) || 0),
      })
      toast({ title: "Produto cadastrado" })
      setOpenNew(false)
      setForm({ name: "", sku: "", quantityOnHand: "0", minStock: "0" })
      load()
    } catch (e: unknown) {
      const msg = e && typeof e === "object" && "response" in e
        ? String((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Falha")
        : "Falha ao cadastrar"
      toast({ title: "Erro", description: msg, variant: "destructive" })
    }
  }

  async function submitMovement() {
    if (!movProduct) return
    const q = Math.max(1, parseInt(movQty, 10) || 0)
    try {
      await productService.addMovement(movProduct.id, { type: movType, quantity: q })
      toast({ title: movType === "IN" ? "Entrada registrada" : "Saída registrada" })
      setMovProduct(null)
      load()
    } catch (e: unknown) {
      const msg = e && typeof e === "object" && "response" in e
        ? String((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Falha")
        : "Falha na movimentação"
      toast({ title: "Erro", description: msg, variant: "destructive" })
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Produtos e estoque"
        description="Cadastro de produtos, movimentações com validação de saldo e histórico."
        icon={<Package />}
      >
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => load()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Button size="sm" onClick={() => setOpenNew(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Novo produto
          </Button>
        </div>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Estoque de peças / insumos</CardTitle>
          <CardDescription>Quantidades e SKU por tenant (produção multi-loja).</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead className="text-right">Mín.</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhum produto. Cadastre o primeiro item.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.sku}</TableCell>
                    <TableCell className="text-right">{p.quantityOnHand}</TableCell>
                    <TableCell className="text-right">{p.minStock}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setMovType("IN")
                          setMovQty("1")
                          setMovProduct(p)
                        }}
                      >
                        <ArrowDownCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setMovType("OUT")
                          setMovQty("1")
                          setMovProduct(p)
                        }}
                      >
                        <ArrowUpCircle className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo produto</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1">
              <Label htmlFor="product-name">Nome</Label>
              <Input id="product-name" placeholder="Nome do produto" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="product-sku">SKU único</Label>
              <Input id="product-sku" placeholder="Código interno" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="product-qty">Quantidade inicial</Label>
              <Input
                id="product-qty"
                placeholder="0"
                type="number"
                min={0}
                value={form.quantityOnHand}
                onChange={(e) => setForm({ ...form, quantityOnHand: e.target.value })}
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="product-min">Estoque mínimo (alerta)</Label>
              <Input
                id="product-min"
                placeholder="0"
                type="number"
                min={0}
                value={form.minStock}
                onChange={(e) => setForm({ ...form, minStock: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="cancel" onClick={() => setOpenNew(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={!form.name.trim() || !form.sku.trim()}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!movProduct} onOpenChange={(o) => !o && setMovProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {movType === "IN" ? "Entrada" : "Saída"} — {movProduct?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-1 py-1">
            <Label htmlFor="mov-qty">Quantidade</Label>
            <Input
              id="mov-qty"
              type="number"
              min={1}
              value={movQty}
              onChange={(e) => setMovQty(e.target.value)}
              placeholder="Unidades"
            />
          </div>
          <DialogFooter>
            <Button variant="cancel" onClick={() => setMovProduct(null)}>
              Cancelar
            </Button>
            <Button onClick={submitMovement}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
