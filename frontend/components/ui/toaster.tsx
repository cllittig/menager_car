"use client"

import { useToast } from "@/components/ui/use-toast"
import {
  type ToastProps,
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react"

function ToastLeadingIcon({ variant }: { variant: ToastProps["variant"] }) {
  const common = "h-5 w-5 shrink-0"
  switch (variant) {
    case "destructive":
      return (
        <XCircle
          className={`${common} text-destructive-foreground opacity-95`}
          aria-hidden
        />
      )
    case "warning":
      return <AlertTriangle className={`${common} text-[hsl(var(--warning))]`} aria-hidden />
    case "info":
      return <Info className={`${common} text-[hsl(var(--info))]`} aria-hidden />
    case "success":
      return <CheckCircle2 className={`${common} text-[hsl(var(--success))]`} aria-hidden />
    default:
      return <CheckCircle2 className={`${common} text-[hsl(var(--success))]`} aria-hidden />
  }
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast key={id} variant={variant} {...props}>
            <ToastLeadingIcon variant={variant} />
            <div className="grid min-w-0 flex-1 gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
