"use client"

import { PageHeader } from "@/components/layout/page-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { AuthService } from "@/lib/services/auth.service"
import { ReportService } from "@/lib/services/report.service"
import { FileBarChart, Plus } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

const reports = new ReportService()

interface HistoryRow {
  id: string
  reportType: string
  title: string
  createdAt: string
}

export default function RelatoriosPage() {
  const { toast } = useToast()
  const [history, setHistory] = useState<HistoryRow[]>([])
  const [title, setTitle] = useState("")
  const [isAdmin, setIsAdmin] = useState(
    () => new AuthService().getCurrentUser()?.role === "ADMIN",
  )
  const [schedOpen, setSchedOpen] = useState(false)
  const [schedForm, setSchedForm] = useState({
    reportType: "DASHBOARD",
    cronExpression: "0 8 * * 1",
    emailTo: "",
  })
  const [schedules, setSchedules] = useState<Record<string, unknown>[]>([])

  const loadHistory = useCallback(async () => {
    try {
      const data = await reports.history()
      setHistory(Array.isArray(data) ? data : [])
    } catch {
      toast({ title: "Erro", description: "Não foi possível carregar histórico.", variant: "destructive" })
    }
  }, [toast])

  useEffect(() => {
    const u = new AuthService().getCurrentUser()
    setIsAdmin(u?.role === "ADMIN")
    loadHistory()
  }, [loadHistory])

  const loadSched = useCallback(async () => {
    try {
      const data = await reports.schedules()
      setSchedules(Array.isArray(data) ? data : [])
    } catch {

    }
  }, [])

  useEffect(() => {
    if (isAdmin) loadSched()
  }, [isAdmin, loadSched])

  async function generate() {
    try {
      await reports.generate("DASHBOARD", title.trim() || undefined)
      toast({ title: "Relatório gerado" })
      loadHistory()
    } catch {
      toast({ title: "Erro ao gerar", variant: "destructive" })
    }
  }

  async function saveSchedule() {
    try {
      await reports.createSchedule({
        reportType: schedForm.reportType,
        cronExpression: schedForm.cronExpression,
        emailTo: schedForm.emailTo.trim(),
      })
      toast({
        title: "Agendamento salvo",
        description: "O envio automático por e-mail depende da configuração do servidor.",
      })
      setSchedOpen(false)
      loadSched()
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
        title="Relatórios"
        description={
          isAdmin
            ? "Gere snapshots do painel, consulte o histórico e configure agendamentos de envio."
            : "Gere snapshots do painel e consulte o histórico de relatórios."
        }
        icon={<FileBarChart />}
      />

      <Card>
        <CardHeader>
          <CardTitle>Gerar relatório consolidado</CardTitle>
          <CardDescription>Snapshot do dashboard (mesmos indicadores da API /dashboard/stats).</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm text-muted-foreground">Título opcional</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Fechamento abril" />
          </div>
          <Button onClick={generate}>Gerar agora</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de relatórios</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((h) => (
                <TableRow key={h.id}>
                  <TableCell>{h.title}</TableCell>
                  <TableCell>{h.reportType}</TableCell>
                  <TableCell>{new Date(h.createdAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {isAdmin && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Agendamentos automáticos</CardTitle>
              <CardDescription>
                Envio por e-mail periódico requer fila ou tarefa agendada no servidor.
              </CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={() => setSchedOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Novo
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cron</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Ativo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((s) => (
                  <TableRow key={String(s.id)}>
                    <TableCell>{String(s.reportType)}</TableCell>
                    <TableCell>{String(s.cronExpression)}</TableCell>
                    <TableCell>{String(s.emailTo)}</TableCell>
                    <TableCell>{String(s.isActive)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {schedOpen && (
        <Card>
          <CardHeader>
            <CardTitle>Novo agendamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-w-md">
            <Input
              value={schedForm.reportType}
              onChange={(e) => setSchedForm({ ...schedForm, reportType: e.target.value })}
              placeholder="Tipo (ex. DASHBOARD)"
            />
            <Input
              value={schedForm.cronExpression}
              onChange={(e) => setSchedForm({ ...schedForm, cronExpression: e.target.value })}
              placeholder="Cron"
            />
            <Input
              value={schedForm.emailTo}
              onChange={(e) => setSchedForm({ ...schedForm, emailTo: e.target.value })}
              placeholder="E-mail destino"
            />
            <div className="flex gap-2">
              <Button onClick={saveSchedule}>Salvar</Button>
              <Button variant="secondary" onClick={() => setSchedOpen(false)}>
                Fechar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
