"use client"

import { Badge } from "@/components/ui/badge"
import { Bookmark, CheckCircle2, Tag, Wrench } from "lucide-react"
import { memo, useMemo } from "react"
import { cn } from "@/lib/utils"

export type VehicleStatusCode =
  | "AVAILABLE"
  | "SOLD"
  | "MAINTENANCE"
  | "RESERVED"
  | string

const statusConfig: Record<
  string,
  {
    label: string
    variant: "success" | "info" | "warning" | "secondary" | "outline"
    icon: typeof CheckCircle2
    className?: string
  }
> = {
  AVAILABLE: {
    label: "Disponível",
    variant: "success",
    icon: CheckCircle2,
  },
  SOLD: {
    label: "Vendido",
    variant: "info",
    icon: Tag,
  },
  MAINTENANCE: {
    label: "Manutenção",
    variant: "warning",
    icon: Wrench,
  },
  RESERVED: {
    label: "Reservado",
    variant: "secondary",
    icon: Bookmark,
    className:
      "border-purple-500/25 bg-purple-100 text-purple-900 dark:bg-purple-950/70 dark:text-purple-100 dark:border-purple-400/40",
  },
}

export interface VehicleStatusBadgeProps {
  status: VehicleStatusCode
  className?: string
}

export const VehicleStatusBadge = memo(function VehicleStatusBadge({
  status,
  className,
}: VehicleStatusBadgeProps) {
  const ui = useMemo(() => {
    const key = status?.toUpperCase?.() ?? status
    return (
      statusConfig[key] ?? {
        label: status,
        variant: "outline" as const,
        icon: CheckCircle2,
      }
    )
  }, [status])

  const Icon = ui.icon

  return (
    <Badge
      variant={ui.variant}
      className={cn(
        "inline-flex items-center gap-1 rounded-md border font-medium",
        ui.className,
        className,
      )}
    >
      <Icon className="shrink-0" aria-hidden />
      {ui.label}
    </Badge>
  )
})
