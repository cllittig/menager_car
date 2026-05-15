import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export function PageHeader({
  title,
  description,
  icon,
  className,
  children,
}: {
  title: string
  description?: string
  icon?: ReactNode
  className?: string
  children?: ReactNode
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight text-foreground">
          {icon ? <span className="text-primary [&_svg]:h-7 [&_svg]:w-7" aria-hidden>{icon}</span> : null}
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-base text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div>
      ) : null}
    </div>
  )
}

export function ListPageLoading({ label }: { label: string }) {
  return (
    <div className="flex min-h-[320px] items-center justify-center">
      <div className="text-center">
        <div
          className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary"
          aria-hidden
        />
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

export function ErrorBanner({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-destructive/35 bg-destructive/5 px-4 py-3 text-sm text-destructive"
    >
      {children}
    </div>
  )
}
