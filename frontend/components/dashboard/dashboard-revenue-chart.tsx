"use client"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { DashboardMonthRevenue } from "@/lib/dashboard/domain/dashboard.types"
import { useMemo } from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

const chartConfig = {
  revenue: {
    label: "Receita",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

export type DashboardRevenueChartProps = {
  rows: DashboardMonthRevenue[]
  formatMoney: (value: number) => string
  monthLabel: (year: number, month: number) => string
}

export function DashboardRevenueChart({ rows, formatMoney, monthLabel }: DashboardRevenueChartProps) {
  const data = useMemo(
    () =>
      rows.map((r) => ({
        key: `${r.year}-${r.month}`,
        name: monthLabel(r.year, r.month),
        revenue: r.amount,
      })),
    [rows, monthLabel],
  )

  return (
    <ChartContainer
      config={chartConfig}
      className="min-h-[220px] min-w-0 h-[220px] w-full [&_.recharts-responsive-container]:min-h-[220px] [&_.recharts-responsive-container]:min-w-0"
    >
      <AreaChart accessibilityLayer data={data} margin={{ top: 10, right: 12, left: 4, bottom: 0 }}>
        <defs>
          <linearGradient id="fillDashboardRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/60" />
        <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={56}
          tickFormatter={(v: number) => formatMoney(v)}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              formatter={(value) => <span className="tabular-nums">{formatMoney(Number(value))}</span>}
            />
          }
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="var(--color-revenue)"
          strokeWidth={2}
          fill="url(#fillDashboardRevenue)"
        />
      </AreaChart>
    </ChartContainer>
  )
}
