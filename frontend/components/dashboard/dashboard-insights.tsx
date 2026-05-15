"use client"

import { DashboardRevenueChart } from "@/components/dashboard/dashboard-revenue-chart"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useCurrency } from "@/hooks/use-currency"
import type { DashboardStats } from "@/lib/dashboard/domain/dashboard.types"
import { useApp } from "@/lib/contexts/app-context"
import { cn } from "@/lib/utils"
import { Car, Gauge, Sparkles, TrendingUp, Wrench } from "lucide-react"
import Link from "next/link"
import { useCallback, useMemo } from "react"

function kpiCardClass(): string {
  return cn(
    "rounded-xl border border-border/60 bg-card/70 p-4 shadow-elevation1 backdrop-blur-sm",
    "dark:border-primary/15 dark:bg-card/50 dark:shadow-[0_0_0_1px_hsl(var(--primary)/0.08)]",
  )
}

export function DashboardInsights({ stats }: { stats: DashboardStats }) {
  const { t, language } = useApp()
  const { formatMoney, formatPercent } = useCurrency()

  const monthLabel = useCallback(
    (year: number, month: number) => {
      const d = new Date(year, month - 1, 1)
      const locale = language === "en" ? "en-US" : language === "es" ? "es-ES" : "pt-BR"
      return d.toLocaleDateString(locale, { month: "short", year: "2-digit" })
    },
    [language],
  )

  const rotationRate = useMemo(() => {
    if (stats.totalVehicles <= 0) return 0
    return (stats.vehiclesSoldThisMonth / stats.totalVehicles) * 100
  }, [stats.totalVehicles, stats.vehiclesSoldThisMonth])

  const maintenancePressure = useMemo(() => {
    if (stats.totalVehicles <= 0) return 0
    return (stats.maintenanceVehicles / stats.totalVehicles) * 100
  }, [stats.maintenanceVehicles, stats.totalVehicles])

  const spread = useMemo(
    () => stats.averageSalePrice - stats.averagePurchasePrice,
    [stats.averagePurchasePrice, stats.averageSalePrice],
  )

  return (
    <section className="space-y-6" aria-labelledby="dashboard-insights-heading">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            id="dashboard-insights-heading"
            className="flex items-center gap-2 text-xl font-semibold tracking-tight text-foreground"
          >
            <Sparkles className="h-5 w-5 shrink-0 text-primary" aria-hidden />
            {t("dashboard.insightsTitle")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("dashboard.insightsSubtitle")}</p>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0 gap-2 self-start sm:self-auto">
          <Link href="/veiculos">
            <Car className="h-4 w-4" aria-hidden />
            {t("dashboard.openInventory")}
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className={kpiCardClass()}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-caption font-medium text-muted-foreground">{t("dashboard.kpiRotation")}</span>
            <Gauge className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          </div>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{formatPercent(rotationRate)}</p>
          <p className="mt-1 text-caption text-muted-foreground">{t("dashboard.kpiRotationDesc")}</p>
        </div>
        <div className={kpiCardClass()}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-caption font-medium text-muted-foreground">
              {t("dashboard.kpiLifetimeRevenue")}
            </span>
            <TrendingUp className="h-4 w-4 shrink-0 text-[hsl(var(--success))]" aria-hidden />
          </div>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{formatMoney(stats.totalRevenue)}</p>
          <p className="mt-1 text-caption text-muted-foreground">{t("dashboard.kpiLifetimeRevenueDesc")}</p>
        </div>
        <div className={kpiCardClass()}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-caption font-medium text-muted-foreground">
              {t("dashboard.kpiMaintenancePressure")}
            </span>
            <Wrench className="h-4 w-4 shrink-0 text-[hsl(var(--warning))]" aria-hidden />
          </div>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{formatPercent(maintenancePressure)}</p>
          <Progress value={Math.min(100, maintenancePressure)} className="mt-2 h-1.5" aria-hidden />
          <p className="mt-1 text-caption text-muted-foreground">{t("dashboard.kpiMaintenancePressureDesc")}</p>
        </div>
        <div className={kpiCardClass()}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-caption font-medium text-muted-foreground">{t("dashboard.kpiSpread")}</span>
            <TrendingUp className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          </div>
          <p
            className={cn(
              "mt-2 text-2xl font-semibold tabular-nums",
              spread >= 0 ? "text-[hsl(var(--success))]" : "text-destructive",
            )}
          >
            {formatMoney(spread)}
          </p>
          <p className="mt-1 text-caption text-muted-foreground">{t("dashboard.kpiSpreadDesc")}</p>
        </div>
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-12">
        <Card
          className={cn(
            "min-w-0 lg:col-span-7",
            "border-border/70 bg-card/80 shadow-elevation2 backdrop-blur-md",
            "dark:border-primary/12 dark:bg-card/45 dark:shadow-[0_0_40px_-12px_hsl(var(--primary)/0.18)]",
          )}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{t("dashboard.revenue6mTitle")}</CardTitle>
            <CardDescription>{t("dashboard.revenue6mDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="min-w-0 pt-0">
            <DashboardRevenueChart
              rows={stats.revenueLast6Months}
              formatMoney={formatMoney}
              monthLabel={monthLabel}
            />
          </CardContent>
        </Card>

        <Card
          className={cn(
            "min-w-0 lg:col-span-5",
            "overflow-hidden border-border/70 bg-card/80 shadow-elevation2 backdrop-blur-md",
            "dark:border-primary/15 dark:bg-gradient-to-b dark:from-card/60 dark:to-primary/5",
          )}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{t("dashboard.topSoldTitle")}</CardTitle>
            <CardDescription>{t("dashboard.topSoldSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {stats.topSoldModel ? (
              <div className="rounded-lg border border-border/50 bg-muted/25 px-4 py-4 dark:bg-background/30">
                <p className="text-lg font-semibold leading-snug text-foreground">
                  {stats.topSoldModel.brand} {stats.topSoldModel.model}
                </p>
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
                {t("dashboard.topSoldEmpty")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
