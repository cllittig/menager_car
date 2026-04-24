"use client"

import { DashboardInsights } from "@/components/dashboard/dashboard-insights"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { useCurrency } from "@/hooks/use-currency"
import { useApp } from "@/lib/contexts/app-context"
import { useDashboardStats } from "@/lib/dashboard"
import {
    AlertTriangle,
    BarChart3,
    Car,
    Check,
    PiggyBank,
    TrendingDown,
    Wrench
} from "lucide-react"

export default function Dashboard() {
  const { t } = useApp()
  const { formatMoney, formatPercent } = useCurrency()
  const { data: stats, isLoading: loading, isError, error: queryError, refetch } = useDashboardStats()
  const errorMessage = isError
    ? queryError instanceof Error
      ? queryError.message
      : "Erro ao carregar dados do dashboard"
    : null



  const getProfitColor = (profit: number) => {
    if (profit > 0) return "text-success"
    if (profit < 0) return "text-destructive"
    return "text-muted-foreground"
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64 max-w-full" />
          <Skeleton className="h-5 w-96 max-w-full" />
        </div>
        <Skeleton className="h-48 w-full rounded-lg" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </div>
    )
  }

  if (errorMessage || !stats) {
    return (
      <Alert variant="destructive" className="max-w-lg">
        <AlertTriangle className="h-4 w-4" aria-hidden />
        <AlertTitle>{t('system.error')}</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>{errorMessage ?? t("system.error")}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-destructive/40"
            onClick={() => void refetch()}
          >
            Tentar novamente
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  const totalExpenses = (stats.monthlyExpenses || 0) + (stats.maintenanceCosts || 0);
  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">{t('dashboard.title')}</h1>
          <p className="mt-1 text-base text-muted-foreground">
            {t('dashboard.overview')} · {currentMonth}
          </p>
        </div>
      </div>

      <DashboardInsights stats={stats} />

      <Card className="border-primary/20 bg-info-muted/40 dark:bg-info-muted/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5 text-primary" aria-hidden />
            {t('dashboard.financialSummary')}
          </CardTitle>
          <CardDescription>{t('dashboard.financialDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Receita */}
            <div className="text-center">
              <div className="mb-1 text-sm font-medium text-muted-foreground">{t('dashboard.revenue')}</div>
              <div className="mb-1 text-3xl font-semibold tabular-nums text-success">
                {formatMoney(stats.monthlyRevenue || 0)}
              </div>
              <div className="text-caption text-muted-foreground">{t('dashboard.grossRevenue')}</div>
            </div>

            <div className="text-center">
              <div className="mb-1 text-sm font-medium text-muted-foreground">{t('dashboard.expenses')}</div>
              <div className="mb-1 text-3xl font-semibold tabular-nums text-destructive">
                {formatMoney(totalExpenses)}
              </div>
              <div className="text-caption text-muted-foreground">{t('dashboard.vehiclesMaintenance')}</div>
            </div>

            <div className="text-center">
              <div className="mb-1 text-sm font-medium text-muted-foreground">{t('dashboard.profit')}</div>
              <div className={`mb-1 text-3xl font-semibold tabular-nums ${getProfitColor(stats.monthlyProfit || 0)}`}>
                {formatMoney(stats.monthlyProfit || 0)}
              </div>
              <Badge variant={(stats.monthlyProfit || 0) >= 0 ? "success" : "destructive"} className="inline-flex items-center gap-1">
                {(stats.monthlyProfit || 0) >= 0 ? (
                  <>
                    <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {t('dashboard.profitLabel')}
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {t('dashboard.lossLabel')}
                  </>
                )}
              </Badge>
            </div>

            <div className="text-center">
              <div className="mb-1 text-sm font-medium text-muted-foreground">{t('dashboard.margin')}</div>
              <div className={`mb-1 text-3xl font-semibold tabular-nums ${getProfitColor(stats.monthlyProfit || 0)}`}>
                {formatPercent(stats.profitMargin || 0)}
              </div>
              <div className="text-caption text-muted-foreground">{t('dashboard.profitability')}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status do estoque e indicadores operacionais */}
      <div className="grid gap-6 lg:grid-cols-2">
        
        {/* Status do Estoque */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5 text-primary" aria-hidden />
              {t('dashboard.stockStatus')}
            </CardTitle>
            <CardDescription>{t('dashboard.stockDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-muted/60 p-4 text-center">
                <div className="text-2xl font-semibold tabular-nums text-foreground">{stats.totalVehicles}</div>
                <div className="text-sm text-muted-foreground">{t('dashboard.totalVehicles')}</div>
              </div>
              <div className="rounded-lg bg-success-muted/80 p-4 text-center dark:bg-success-muted/30">
                <div className="text-2xl font-semibold tabular-nums text-[hsl(var(--success))]">{stats.availableVehicles}</div>
                <div className="text-sm text-muted-foreground">{t('dashboard.available')}</div>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t('dashboard.soldThisMonth')}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="info">
                    {stats.vehiclesSoldThisMonth || 0} {t('dashboard.units')}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t('dashboard.inMaintenance')}</span>
                <div className="flex items-center gap-2">
                  <Badge variant={stats.maintenanceVehicles > 0 ? "destructive" : "outline"}>
                    {stats.maintenanceVehicles} {t('dashboard.units')}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t('dashboard.availabilityRate')}</span>
                <Badge variant="success">
                  {stats.totalVehicles > 0 ? Math.round((stats.availableVehicles / stats.totalVehicles) * 100) : 0}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Indicadores Operacionais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" aria-hidden />
              {t('dashboard.operationalIndicators')}
            </CardTitle>
            <CardDescription>{t('dashboard.operationalDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-info-muted/70 p-4 text-center dark:bg-info-muted/25">
                <div className="text-2xl font-semibold tabular-nums text-[hsl(var(--info))]">{stats.totalClients}</div>
                <div className="text-sm text-muted-foreground">{t('dashboard.totalClients')}</div>
              </div>
              <div className="rounded-lg bg-secondary p-4 text-center">
                <div className="text-2xl font-semibold tabular-nums text-foreground">{stats.vehiclesSoldThisMonth || 0}</div>
                <div className="text-sm text-muted-foreground">{t('dashboard.salesThisMonth')}</div>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t('dashboard.averageTicket')}</span>
                <div className="text-right">
                  <div className="font-semibold tabular-nums text-success">
                    {formatMoney(stats.averageSalePrice || 0)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t('dashboard.registeredContracts')}</span>
                <Badge variant="outline">
                  {stats.activeContracts} {t('dashboard.documents')}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t('dashboard.maintenanceCosts')}</span>
                <div className="text-right">
                  <div className="font-semibold tabular-nums text-destructive">
                    {formatMoney(stats.maintenanceCosts || 0)}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas contextuais */}
      {stats.maintenanceVehicles > 0 && (
        <Alert className="border-warning/35 bg-warning-muted/50 dark:bg-warning-muted/25">
          <Wrench className="h-4 w-4 text-[hsl(var(--warning))]" aria-hidden />
          <AlertTitle className="text-[hsl(var(--warning))]">
            {t('dashboard.vehiclesInMaintenance')}
          </AlertTitle>
          <AlertDescription className="text-foreground/90">
            <strong>{stats.maintenanceVehicles} veículo(s)</strong> {t('dashboard.vehiclesInMaintenanceDesc')} <strong>{stats.totalVehicles > 0 ? Math.round((stats.maintenanceVehicles / stats.totalVehicles) * 100) : 0}%</strong> {t('dashboard.ofStock')}
          </AlertDescription>
        </Alert>
      )}

      {(stats.monthlyProfit || 0) < 0 && (
        <Alert variant="destructive">
          <TrendingDown className="h-4 w-4" />
          <AlertTitle>{t('dashboard.monthlyLoss')}</AlertTitle>
          <AlertDescription>
            {t('dashboard.monthlyLossDesc')} <strong>{formatMoney(Math.abs(stats.monthlyProfit || 0))}</strong>. 
            {t('dashboard.monthlyLossAdvice')}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
