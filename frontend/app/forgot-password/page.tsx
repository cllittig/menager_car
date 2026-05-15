"use client"

import {
  AuthBrandHeader,
  AuthGlassCard,
  AuthPublicFooter,
  AuthPublicShell,
} from "@/components/auth/auth-public-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { AuthService } from "@/lib/services/auth.service"
import { cn } from "@/lib/utils"
import { AlertCircle, CheckCircle, Mail } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function ForgotPasswordPage() {
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [emailError, setEmailError] = useState("")

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!value) {
      setEmailError("")
    } else if (!emailRegex.test(value)) {
      setEmailError("E-mail inválido")
    } else {
      setEmailError("")
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) {
      setEmailError("E-mail é obrigatório")
      toast({
        title: "Campo obrigatório",
        description: "Informe o e-mail da sua conta.",
        variant: "destructive",
      })
      return
    }
    validateEmail(trimmed)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return
    }

    setLoading(true)
    try {
      const res = await new AuthService().requestPasswordReset(trimmed)
      if (res.statusCode === 404) {
        toast({
          title: "E-mail não cadastrado",
          description: res.message,
          variant: "destructive",
        })
      } else if (res.statusCode >= 400) {
        toast({
          title: "Não foi possível enviar",
          description: res.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Instruções enviadas",
          description: res.message,
          variant: "success",
        })
      }
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível concluir o pedido. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthPublicShell>
      <AuthGlassCard>
        <AuthBrandHeader
          title="Recuperar senha"
          subtitle="Informe o e-mail cadastrado na ManagerCar. Se existir uma conta, enviaremos um link seguro para redefinir a senha."
        />

        <form method="post" onSubmit={submit} className="space-y-6">
          <div>
            <label
              htmlFor="forgot-email"
              className="flex items-center gap-2 text-sm font-medium text-foreground"
            >
              <Mail className="h-4 w-4 shrink-0" aria-hidden />
              E-mail
            </label>
            <div className="relative">
              <Input
                id="forgot-email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  validateEmail(e.target.value)
                }}
                disabled={loading}
                autoComplete="email"
                className={cn(
                  "mt-2 h-12 rounded-lg border border-input bg-background pl-4 pr-10 text-sm transition-[color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  emailError && "border-destructive",
                )}
                placeholder="exemplo@email.com"
              />
              {email && !emailError ? (
                <CheckCircle className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[hsl(var(--success))]" aria-hidden />
              ) : null}
              {emailError ? (
                <AlertCircle className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-destructive" aria-hidden />
              ) : null}
            </div>
            {emailError ? (
              <p className="mt-1 flex items-center gap-1 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
                {emailError}
              </p>
            ) : null}
          </div>

          <p className="rounded-lg border border-border bg-muted/50 px-4 py-3 text-caption leading-relaxed text-muted-foreground">
            Você só recebe e-mail se o endereço estiver cadastrado. Verifique também a pasta de spam.
          </p>

          <Button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-lg text-base font-semibold shadow-elevation1"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                Enviando…
              </span>
            ) : (
              "Enviar link de redefinição"
            )}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <Link
            href="/login"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Voltar ao login
          </Link>
        </div>
      </AuthGlassCard>
      <AuthPublicFooter />
    </AuthPublicShell>
  )
}
