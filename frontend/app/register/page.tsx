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
import { extractApiMessage, registerFailureToast } from "@/lib/user-facing-errors"
import { AuthService } from "@/lib/services/auth.service"
import { cn } from "@/lib/utils"
import {
  AlertCircle,
  Building2,
  CheckCircle,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  ShieldPlus,
  User,
  type LucideIcon,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useRef, useState } from "react"

type StrengthLabels = {
  veryWeak: string
  weak: string
  fair: string
  good: string
  strong: string
}

function registerPasswordStrengthMeta(
  strength: number,
  labels: StrengthLabels,
): {
  label: string
  Icon: LucideIcon
  iconClass: string
  labelClass: string
} {
  if (strength <= 0) {
    return {
      label: labels.veryWeak,
      Icon: ShieldOff,
      iconClass: "text-destructive",
      labelClass: "text-destructive",
    }
  }
  if (strength === 1) {
    return {
      label: labels.weak,
      Icon: ShieldAlert,
      iconClass: "text-destructive",
      labelClass: "text-destructive",
    }
  }
  if (strength === 2) {
    return {
      label: labels.fair,
      Icon: Shield,
      iconClass: "text-[hsl(var(--warning))]",
      labelClass: "text-[hsl(var(--warning))]",
    }
  }
  if (strength === 3) {
    return {
      label: labels.good,
      Icon: ShieldPlus,
      iconClass: "text-[hsl(var(--info))]",
      labelClass: "text-[hsl(var(--info))]",
    }
  }
  return {
    label: labels.strong,
    Icon: ShieldCheck,
    iconClass: "text-[hsl(var(--success))]",
    labelClass: "text-[hsl(var(--success))]",
  }
}

function computeRegisterErrors(
  nome: string,
  email: string,
  senha: string,
  confirmarSenha: string,
  t: (key: string) => string,
): { nameError: string; emailError: string; passwordError: string; confirmPasswordError: string } {
  const nomeT = nome.trim()
  let nameError = ""
  if (!nomeT) nameError = "Nome é obrigatório"
  else if (nomeT.length < 2) nameError = "Nome deve ter pelo menos 2 caracteres"

  const emailT = email.trim()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  let emailError = ""
  if (!emailT) emailError = "Email é obrigatório"
  else if (!emailRegex.test(emailT)) emailError = "Email inválido"

  let passwordError = ""
  if (!senha) passwordError = "Senha é obrigatória"
  else if (senha.length < 6) passwordError = "Senha deve ter pelo menos 6 caracteres"
  else if (!/(?=.*[a-z])(?=.*[A-Z])/.test(senha)) {
    passwordError = "Senha deve conter letras maiúsculas e minúsculas"
  } else if (!/(?=.*\d)/.test(senha)) {
    passwordError = "Senha deve conter pelo menos um número"
  }

  let confirmPasswordError = ""
  if (!confirmarSenha) confirmPasswordError = t("register.confirmRequired")
  else if (confirmarSenha !== senha) confirmPasswordError = t("register.passwordMismatch")

  return { nameError, emailError, passwordError, confirmPasswordError }
}

function getPasswordStrength(password: string): number {
  let strength = 0
  if (password.length >= 6) strength++
  if (/(?=.*[a-z])(?=.*[A-Z])/.test(password)) strength++
  if (/(?=.*\d)/.test(password)) strength++
  if (/(?=.*[!@#$%^&*])/.test(password)) strength++
  return strength
}

export default function RegisterPage() {
  const { t } = useApp()
  const [nome, setNome] = useState("")
  const [nomeEmpresa, setNomeEmpresa] = useState("")
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [confirmarSenha, setConfirmarSenha] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const authService = new AuthService()
  const emailInputRef = useRef<HTMLInputElement>(null)
  const [nameError, setNameError] = useState("")
  const [emailError, setEmailError] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [confirmPasswordError, setConfirmPasswordError] = useState("")

  const strengthLabels = useMemo(
    () => ({
      veryWeak: t("register.strengthVeryWeak"),
      weak: t("register.strengthWeak"),
      fair: t("register.strengthFair"),
      good: t("register.strengthGood"),
      strong: t("register.strengthStrong"),
    }),
    [t],
  )

  const validateName = (name: string) => {
    if (!name) {
      setNameError("")
    } else if (name.trim().length < 2) {
      setNameError("Nome deve ter pelo menos 2 caracteres")
    } else {
      setNameError("")
    }
  }

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

  const validatePassword = (password: string) => {
    if (!password) {
      setPasswordError("")
    } else if (password.length < 6) {
      setPasswordError("Senha deve ter pelo menos 6 caracteres")
    } else if (!/(?=.*[a-z])(?=.*[A-Z])/.test(password)) {
      setPasswordError("Senha deve conter letras maiúsculas e minúsculas")
    } else if (!/(?=.*\d)/.test(password)) {
      setPasswordError("Senha deve conter pelo menos um número")
    } else {
      setPasswordError("")
    }
  }

  const validateConfirmPassword = (value: string, senhaAtual: string) => {
    if (!value) {
      setConfirmPasswordError("")
    } else if (value !== senhaAtual) {
      setConfirmPasswordError(t("register.passwordMismatch"))
    } else {
      setConfirmPasswordError("")
    }
  }

  const senhaStrength = useMemo(() => getPasswordStrength(senha), [senha])
  const senhaStrengthMeta = useMemo(
    () => registerPasswordStrengthMeta(senhaStrength, strengthLabels),
    [senhaStrength, strengthLabels],
  )
  const StrengthIcon = senhaStrengthMeta.Icon

  const inputClass =
    "mt-2 h-12 rounded-lg border border-input bg-background pl-4 text-sm transition-[color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const errs = computeRegisterErrors(nome, email, senha, confirmarSenha, t)
    setNameError(errs.nameError)
    setEmailError(errs.emailError)
    setPasswordError(errs.passwordError)
    setConfirmPasswordError(errs.confirmPasswordError)

    if (errs.nameError || errs.emailError || errs.passwordError || errs.confirmPasswordError) {
      toast({
        title: t("register.toastValidationTitle"),
        description: t("register.fixValidation"),
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await authService.register({
        nome: nome.trim(),
        email: email.trim(),
        senha: senha,
        ...(nomeEmpresa.trim().length >= 2 ? { nomeEmpresa: nomeEmpresa.trim() } : {}),
      })

      const ok = response.statusCode >= 200 && response.statusCode < 300

      if (ok) {
        toast({
          title: t("register.success"),
          description: response.message || t("register.successMessage"),
          variant: "success",
        })
        setTimeout(() => {
          router.replace("/login")
        }, 1200)
      } else if (response.statusCode === 409) {
        setEmailError(t("register.emailTakenInline"))
        emailInputRef.current?.focus()
        toast({
          title: t("register.emailTakenTitle"),
          description: t("register.emailTakenDescription"),
          variant: "destructive",
        })
      } else {
        const { title, description } = registerFailureToast(
          response.statusCode ?? 400,
          response.message,
          t,
        )
        toast({
          title,
          description,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao cadastrar:", error)
      const err = error as { response?: { status?: number; data?: unknown }; message?: string }
      const sc = err.response?.status ?? 500
      const msg =
        err.response?.data !== undefined
          ? extractApiMessage(err.response.data)
          : typeof err.message === "string"
            ? err.message
            : ""
      const { title, description } = registerFailureToast(sc, msg || undefined, t)
      toast({
        title,
        description: description || t("register.serverError"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthPublicShell containerClassName="max-w-lg">
      <AuthGlassCard>
        <AuthBrandHeader title={t("register.title")} subtitle={t("register.subtitle")} />

        <form method="post" onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="flex items-center gap-2 text-sm font-medium text-foreground">
                <User className="h-4 w-4 shrink-0" aria-hidden />
                {t("register.name")}
              </label>
              <div className="relative">
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={nome}
                  onChange={(e) => {
                    setNome(e.target.value)
                    validateName(e.target.value)
                  }}
                  disabled={isLoading}
                  autoComplete="name"
                  className={cn(inputClass, "pr-10", nameError && "border-destructive")}
                  placeholder={t("register.namePlaceholder")}
                />
                {nome.trim() && !nameError ? (
                  <CheckCircle
                    className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[hsl(var(--success))]"
                    aria-hidden
                  />
                ) : null}
                {nameError ? (
                  <AlertCircle className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-destructive" aria-hidden />
                ) : null}
              </div>
              {nameError ? (
                <p className="mt-1 flex items-center gap-1 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
                  {nameError}
                </p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="company-name"
                className="flex items-center gap-2 text-sm font-medium text-foreground"
              >
                <Building2 className="h-4 w-4 shrink-0" aria-hidden />
                {t("register.companyName")}
              </label>
              <p className="mt-1 text-caption leading-relaxed text-muted-foreground">{t("register.companyNameHint")}</p>
              <Input
                id="company-name"
                name="company-name"
                type="text"
                value={nomeEmpresa}
                onChange={(e) => setNomeEmpresa(e.target.value)}
                disabled={isLoading}
                autoComplete="organization"
                className={cn(inputClass, "pr-4")}
                placeholder="Ex.: Concessionária Exemplo Ltda"
              />
            </div>

            <div>
              <label htmlFor="email" className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Mail className="h-4 w-4 shrink-0" aria-hidden />
                {t("register.email")}
              </label>
              <div className="relative">
                <Input
                  ref={emailInputRef}
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    validateEmail(e.target.value)
                  }}
                  disabled={isLoading}
                  autoComplete="email"
                  className={cn(inputClass, "pr-10", emailError && "border-destructive")}
                  placeholder="exemplo@email.com"
                />
                {email.trim() && !emailError ? (
                  <CheckCircle
                    className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[hsl(var(--success))]"
                    aria-hidden
                  />
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

            <div>
              <label htmlFor="password" className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Lock className="h-4 w-4 shrink-0" aria-hidden />
                {t("register.password")}
              </label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={senha}
                  onChange={(e) => {
                    const v = e.target.value
                    setSenha(v)
                    validatePassword(v)
                    if (confirmarSenha) validateConfirmPassword(confirmarSenha, v)
                  }}
                  disabled={isLoading}
                  autoComplete="new-password"
                  className={cn(inputClass, "pr-12", passwordError && "border-destructive")}
                  placeholder="••••••••"
                />
                <button
                  id="toggle-password-register"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" aria-hidden /> : <Eye className="h-5 w-5" aria-hidden />}
                </button>
              </div>
              {passwordError ? (
                <p className="mt-1 flex items-center gap-1 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
                  {passwordError}
                </p>
              ) : null}
            </div>

            <div className="rounded-xl border border-border bg-muted/30 px-3 py-3 sm:px-4 sm:py-4">
              <label htmlFor="password-confirm" className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Lock className="h-4 w-4 shrink-0" aria-hidden />
                <span>{t("register.passwordConfirm")}</span>
              </label>
              <p id="password-confirm-hint" className="mt-1 text-caption leading-relaxed text-muted-foreground">
                {t("register.passwordConfirmHint")}
              </p>
              <div className="relative">
                <Input
                  id="password-confirm"
                  name="password-confirm"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmarSenha}
                  onChange={(e) => {
                    const v = e.target.value
                    setConfirmarSenha(v)
                    validateConfirmPassword(v, senha)
                  }}
                  disabled={isLoading}
                  autoComplete="new-password"
                  aria-describedby="password-confirm-hint"
                  className={cn(inputClass, "pr-12", confirmPasswordError && "border-destructive")}
                  placeholder={t("register.passwordConfirmPlaceholder")}
                />
                <button
                  id="toggle-password-confirm-register"
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label={
                    showConfirmPassword ? "Ocultar confirmação de senha" : "Mostrar confirmação de senha"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" aria-hidden />
                  ) : (
                    <Eye className="h-5 w-5" aria-hidden />
                  )}
                </button>
              </div>
              {confirmPasswordError ? (
                <p className="mt-1 flex items-center gap-1 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
                  {confirmPasswordError}
                </p>
              ) : null}
            </div>

            {senha ? (
              <div
                className="rounded-xl border border-border bg-card px-3 py-3"
                role="status"
                aria-live="polite"
              >
                <div className="mb-2 flex min-h-6 items-center gap-2">
                  <StrengthIcon className={cn("h-4 w-4 shrink-0", senhaStrengthMeta.iconClass)} aria-hidden />
                  <span className="text-caption text-muted-foreground">
                    {t("register.passwordStrengthPrefix")}{" "}
                    <span className={cn("font-semibold text-foreground", senhaStrengthMeta.labelClass)}>
                      {senhaStrengthMeta.label}
                    </span>
                  </span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={cn(
                        "h-2 flex-1 rounded-full transition-colors",
                        senhaStrength >= level
                          ? level <= 1
                            ? "bg-destructive"
                            : level === 2
                              ? "bg-warning"
                              : level === 3
                                ? "bg-info"
                                : "bg-success"
                          : "bg-muted",
                      )}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="h-12 w-full rounded-lg text-base font-semibold shadow-elevation1"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                {t("register.registerButtonLoading")}
              </span>
            ) : (
              t("register.registerButton")
            )}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            {t("register.hasAccount")}{" "}
            <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
              {t("register.login")}
            </Link>
          </p>
        </div>
      </AuthGlassCard>
      <AuthPublicFooter />
    </AuthPublicShell>
  )
}
