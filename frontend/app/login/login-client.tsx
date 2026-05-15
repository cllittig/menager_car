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
import { useApp } from "@/lib/contexts/app-context"
import { AuthService } from "@/lib/services/auth.service"
import { cn } from "@/lib/utils"
import { AlertCircle, CheckCircle, Eye, EyeOff, Lock, Mail } from "lucide-react"
import { getToken } from "@/lib/auth"
import { extractApiMessage, loginFailureToast } from "@/lib/user-facing-errors"
import Link from "next/link"
import { useState } from "react"

export default function LoginClientPage() {
  const { t } = useApp()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const authService = new AuthService()
  const [emailError, setEmailError] = useState("")
  const [passwordError, setPasswordError] = useState("")

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!value) {
      setEmailError("")
    } else if (!emailRegex.test(value)) {
      setEmailError("Email inválido")
    } else {
      setEmailError("")
    }
  }

  const validatePassword = (value: string) => {
    if (!value) {
      setPasswordError("")
    } else if (value.length < 6) {
      setPasswordError("Senha deve ter pelo menos 6 caracteres")
    } else {
      setPasswordError("")
    }
  }

  const handleLogin = async () => {
    if (!email || !password) {
      if (!email) setEmailError("Email é obrigatório")
      if (!password) setPasswordError("Senha é obrigatória")
      toast({
        title: t("login.toastValidationTitle"),
        description: t("login.fillFields"),
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await authService.login({
        email,
        senha: password,
      })

      const hasSession = Boolean(response.token ?? response.accessToken ?? getToken())

      if (hasSession) {
        toast({
          title: t("login.success"),
          description: t("login.redirecting"),
          variant: "success",
        })
        window.location.assign("/")
      } else {
        const { title, description } = loginFailureToast(
          response.statusCode ?? 401,
          response.message,
          t,
        )
        toast({
          title,
          description,
          variant: "destructive",
        })
      }
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; data?: unknown }; message?: string }
      const status = err.response?.status ?? 500
      const backendMsg =
        err.response?.data !== undefined
          ? extractApiMessage(err.response.data)
          : typeof err.message === "string"
            ? err.message
            : ""
      const { title, description } = loginFailureToast(status, backendMsg || undefined, t)
      toast({
        title,
        description: description || t("login.serverError"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation()
    void handleLogin()
  }

  return (
    <AuthPublicShell>
      <AuthGlassCard>
        <AuthBrandHeader title={t("login.title")} subtitle={t("login.subtitle")} />

        <form method="post" onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="flex items-center gap-2 text-sm font-medium text-foreground"
              >
                <Mail className="h-4 w-4" />
                {t("login.email")}
              </label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    validateEmail(e.target.value)
                  }}
                  disabled={isLoading}
                  autoComplete="email"
                  className={cn(
                    "mt-2 h-12 rounded-lg border border-input bg-background pl-4 pr-10 text-sm transition-[color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    emailError && "border-destructive",
                  )}
                  placeholder="exemplo@email.com"
                />
                {email && !emailError && (
                  <CheckCircle
                    className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[hsl(var(--success))]"
                    aria-hidden
                  />
                )}
                {emailError && (
                  <AlertCircle
                    className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-destructive"
                    aria-hidden
                  />
                )}
              </div>
              {emailError && (
                <p className="mt-1 flex items-center gap-1 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {emailError}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="flex items-center gap-2 text-sm font-medium text-foreground"
              >
                <Lock className="h-4 w-4" />
                {t("login.password")}
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    validatePassword(e.target.value)
                  }}
                  disabled={isLoading}
                  autoComplete="current-password"
                  className={cn(
                    "mt-2 h-12 rounded-lg border border-input bg-background pl-4 pr-12 text-sm transition-[color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    passwordError && "border-destructive",
                  )}
                  placeholder="••••••••"
                />
                <button
                  id="toggle-password-login"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" aria-hidden /> : <Eye className="h-5 w-5" aria-hidden />}
                </button>
              </div>
              {passwordError && (
                <p className="mt-1 flex items-center gap-1 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {passwordError}
                </p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="h-12 w-full rounded-lg text-base font-semibold shadow-elevation1"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                {t("login.loginButtonLoading")}
              </div>
            ) : (
              t("login.loginButton")
            )}
          </Button>
        </form>

        <div className="mt-8 space-y-2 text-center">
          <p className="text-sm">
            <Link href="/forgot-password" className="font-medium text-primary underline-offset-4 hover:underline">
              Esqueci minha senha
            </Link>
          </p>
          <p className="text-sm text-muted-foreground">
            {t("login.noAccount")}{" "}
            <Link href="/register" className="font-medium text-primary underline-offset-4 hover:underline">
              {t("login.register")}
            </Link>
          </p>
        </div>
      </AuthGlassCard>
      <AuthPublicFooter />
    </AuthPublicShell>
  )
}
