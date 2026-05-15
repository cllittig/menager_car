"use client"

import { Button } from "@/components/ui/button"
import { useApp } from "@/lib/contexts/app-context"
import { cn } from "@/lib/utils"
import { Car, Moon, Sun } from "lucide-react"
import type { ReactNode } from "react"

export function AuthPublicShell({
  children,
  containerClassName,
}: {
  children: ReactNode

  containerClassName?: string
}) {
  const { language, theme, setLanguage, setTheme } = useApp()

  return (
    <div
      className="relative flex min-h-screen overflow-hidden bg-muted/30 dark:bg-background"
      suppressHydrationWarning
    >
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-[0.07] dark:opacity-[0.12]" aria-hidden />

      <div className="fixed right-4 top-4 z-10 flex items-center gap-2">
        <div className="flex rounded-lg border border-border bg-card p-1 shadow-elevation1">
          {(
            [
              { code: "pt" as const, label: "PT" },
              { code: "en" as const, label: "EN" },
              { code: "es" as const, label: "ES" },
            ] as const
          ).map(({ code, label }) => (
            <button
              key={code}
              type="button"
              onClick={() => setLanguage(code)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                language === code
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="h-auto rounded-lg px-3 py-1.5 text-sm font-medium shadow-elevation1"
          aria-label={theme === "light" ? "Ativar tema escuro" : "Ativar tema claro"}
        >
          {theme === "light" ? <Moon className="h-4 w-4" aria-hidden /> : <Sun className="h-4 w-4" aria-hidden />}
        </Button>
      </div>

      <div className="flex flex-1 items-center justify-center p-6 py-10 sm:py-12">
        <div className={cn("w-full", containerClassName ?? "max-w-md")}>{children}</div>
      </div>
    </div>
  )
}

export function AuthGlassCard({ children }: { children: ReactNode }) {
  return (
    <div className="fade-in rounded-2xl border border-border bg-card p-8 shadow-elevation2 sm:p-10">
      {children}
    </div>
  )
}

export function AuthBrandHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-8 text-center">
      <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-elevation1">
        <Car className="h-7 w-7" aria-hidden />
      </div>
      <h1 className="mb-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{title}</h1>
      {subtitle ? (
        <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">{subtitle}</p>
      ) : null}
    </div>
  )
}

export function AuthPublicFooter() {
  const { t } = useApp()
  return (
    <div className="mt-8 text-center">
      <p className="text-caption text-muted-foreground">
        © <span suppressHydrationWarning>{new Date().getFullYear()}</span> {t("login.title")}. Todos os direitos
        reservados.
      </p>
    </div>
  )
}
