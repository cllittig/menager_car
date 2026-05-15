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
import { getSupabaseBrowser, recoverSessionFromRecoveryRedirect } from "@/lib/supabase-browser"
import { cn } from "@/lib/utils"
import { AlertCircle, Eye, EyeOff, KeyRound, Loader2, Lock } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState, type ReactNode } from "react"

type RecoveryFlow =
  | "loading"
  | "supabase"
  | "legacy"
  | "missing_env"
  | "no_session"
  | "redirect_error"

function RecoveryStateCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <AuthPublicShell>
      <AuthGlassCard>
        <AuthBrandHeader title={title} subtitle={subtitle} />
        {children}
      </AuthGlassCard>
      <AuthPublicFooter />
    </AuthPublicShell>
  )
}

function ResetPasswordForm() {
  const { toast } = useToast()
  const router = useRouter()
  const params = useSearchParams()
  const legacyToken = params.get("token") ?? ""
  const [senha, setSenha] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [flow, setFlow] = useState<RecoveryFlow>("loading")
  const [redirectErrorDetail, setRedirectErrorDetail] = useState<string | null>(null)

  useEffect(() => {
    if (legacyToken) {
      setFlow("legacy")
      return
    }

    const sb = getSupabaseBrowser()
    if (!sb) {
      setFlow("missing_env")
      return
    }

    let cancelled = false
    let resolved = false
    let subscription: { unsubscribe: () => void } | undefined

    const finish = (next: RecoveryFlow) => {
      if (cancelled || resolved) return
      resolved = true
      subscription?.unsubscribe()
      setFlow(next)
    }

    void (async () => {
      const redirectResult = await recoverSessionFromRecoveryRedirect(sb)
      if (cancelled) return
      if (redirectResult.handled && redirectResult.error) {
        setRedirectErrorDetail(redirectResult.error)
        finish("redirect_error")
        return
      }

      const first = await sb.auth.getSession()
      if (cancelled) return
      if (first.data.session) {
        finish("supabase")
        return
      }

      const { data } = sb.auth.onAuthStateChange((event, session) => {
        if (!session) return
        if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN" || event === "INITIAL_SESSION") {
          finish("supabase")
        }
      })
      subscription = data.subscription

      for (let i = 0; i < 8; i++) {
        await new Promise((r) => setTimeout(r, 400))
        if (cancelled) return
        const snap = await sb.auth.getSession()
        if (snap.data.session) {
          finish("supabase")
          return
        }
      }

      finish("no_session")
    })()

    return () => {
      cancelled = true
      subscription?.unsubscribe()
    }
  }, [legacyToken])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (senha !== confirm) {
      toast({ title: "Senhas diferentes", description: "Confirme a mesma senha nos dois campos.", variant: "destructive" })
      return
    }
    if (senha.length < 6) {
      toast({ title: "Senha muito curta", description: "Use pelo menos 6 caracteres.", variant: "destructive" })
      return
    }

    if (flow === "legacy") {
      if (!legacyToken) {
        toast({
          title: "Token ausente",
          description: "Use o link completo enviado por e-mail.",
          variant: "destructive",
        })
        return
      }
      setLoading(true)
      try {
        await new AuthService().resetPassword(legacyToken, senha)
        toast({ title: "Senha atualizada", variant: "success" })
        router.push("/login")
      } catch {
        toast({ title: "Falha", description: "Token inválido ou expirado.", variant: "destructive" })
      } finally {
        setLoading(false)
      }
      return
    }

    if (flow !== "supabase") {
      return
    }

    const sb = getSupabaseBrowser()
    if (!sb) {
      toast({
        title: "Configuração",
        description: "Supabase não configurado no frontend.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const { error: updateErr } = await sb.auth.updateUser({ password: senha })
      if (updateErr) {
        toast({
          title: "Falha ao definir senha",
          description: updateErr.message,
          variant: "destructive",
        })
        return
      }
      const { data: sessionData } = await sb.auth.getSession()
      const access = sessionData.session?.access_token
      if (!access) {
        toast({
          title: "Sessão",
          description: "Não foi possível obter o token de recuperação.",
          variant: "destructive",
        })
        return
      }
      await new AuthService().syncPasswordFromRecovery(access, senha)
      await sb.auth.signOut()
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", "/reset-password")
      }
      toast({
        title: "Senha atualizada",
        description: "Faça login com a nova senha.",
        variant: "success",
      })
      router.push("/login")
    } catch {
      toast({
        title: "Falha",
        description: "Não foi possível sincronizar com o servidor. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (flow === "loading") {
    return (
      <AuthPublicShell>
        <AuthGlassCard>
          <AuthBrandHeader
            title="Nova senha"
            subtitle="Validando o link enviado por e-mail. Aguarde um momento."
          />
          <div className="flex flex-col items-center justify-center gap-4 py-10">
            <Loader2 className="h-12 w-12 animate-spin text-primary" aria-hidden />
            <p className="text-center text-sm text-muted-foreground">Validando a sessão de recuperação…</p>
          </div>
        </AuthGlassCard>
        <AuthPublicFooter />
      </AuthPublicShell>
    )
  }

  if (flow === "missing_env") {
    return (
      <RecoveryStateCard
        title="Configuração incompleta"
        subtitle="A recuperação nativa precisa das variáveis públicas do Supabase no frontend."
      >
        <div className="space-y-2 rounded-lg border border-warning/35 bg-warning-muted/50 px-4 py-3 text-sm text-[hsl(var(--warning))] dark:bg-warning-muted/20">
          <p>Defina no ambiente do Next.js:</p>
          <ul className="list-disc list-inside text-xs font-mono space-y-1 opacity-90">
            <li>NEXT_PUBLIC_SUPABASE_URL</li>
            <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
          </ul>
        </div>
        <Button asChild className="w-full h-12 mt-6 rounded-xl" variant="outline">
          <Link href="/login">Voltar ao login</Link>
        </Button>
      </RecoveryStateCard>
    )
  }

  if (flow === "redirect_error") {
    return (
      <RecoveryStateCard
        title="Link não validado"
        subtitle="Não foi possível concluir a verificação automática. Peça um novo e-mail ou tente em outro navegador."
      >
        <div className="flex gap-2 rounded-lg border border-destructive/35 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" aria-hidden />
          <div>
            {redirectErrorDetail ? (
              <p className="break-words text-xs sm:text-sm opacity-95">{redirectErrorDetail}</p>
            ) : (
              <p>O servidor de autenticação recusou este link.</p>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <Button asChild className="flex-1 h-12 rounded-xl" variant="outline">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild className="h-12 flex-1 rounded-lg shadow-elevation1">
            <Link href="/forgot-password">Pedir novo link</Link>
          </Button>
        </div>
      </RecoveryStateCard>
    )
  }

  if (flow === "no_session") {
    return (
      <RecoveryStateCard
        title="Link expirado ou inválido"
        subtitle="Este endereço não é mais válido. Os links de recuperação são de uso único e têm tempo limitado."
      >
        <p className="text-sm leading-relaxed text-muted-foreground">
          Confirme no Supabase que a URL de redirecionamento inclui o caminho{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">/reset-password</code> do site onde abriu o link.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button asChild className="h-12 flex-1 rounded-lg" variant="outline">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild className="h-12 flex-1 rounded-lg shadow-elevation1">
            <Link href="/forgot-password">Novo e-mail de recuperação</Link>
          </Button>
        </div>
      </RecoveryStateCard>
    )
  }

  return (
    <AuthPublicShell>
      <AuthGlassCard>
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-elevation1">
            <KeyRound className="h-7 w-7" aria-hidden />
          </div>
          <h1 className="mb-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Nova senha</h1>
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
            {flow === "legacy"
              ? "Defina uma nova senha com o token do e-mail. Depois você pode entrar normalmente."
              : "Escolha uma senha segura. Ela valerá para o login na ManagerCar e para a sessão de recuperação."}
          </p>
        </div>

        <form method="post" onSubmit={submit} className="space-y-6">
          <div>
            <label htmlFor="new-password" className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Lock className="h-4 w-4 shrink-0" aria-hidden />
              Nova senha
            </label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPassword ? "text" : "password"}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
                className="mt-2 h-12 rounded-lg border border-input bg-background pl-4 pr-12 text-sm transition-[color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                placeholder="Mínimo 6 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff className="h-5 w-5" aria-hidden /> : <Eye className="h-5 w-5" aria-hidden />}
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-dashed border-border bg-muted/30 px-3 py-3 sm:px-4 sm:py-4">
            <label htmlFor="confirm-password" className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Lock className="h-4 w-4 shrink-0" aria-hidden />
              Confirmar senha
            </label>
            <p className="mt-1 text-caption text-muted-foreground">
              Digite novamente a mesma senha do campo acima.
            </p>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirm ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
                className={cn(
                  "mt-2 h-12 rounded-lg border border-input bg-background pl-4 pr-12 text-sm transition-[color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  confirm.length > 0 && senha !== confirm && "border-destructive focus-visible:ring-destructive/30",
                )}
                placeholder="Repita a senha"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label={showConfirm ? "Ocultar confirmação" : "Mostrar confirmação"}
              >
                {showConfirm ? <EyeOff className="h-5 w-5" aria-hidden /> : <Eye className="h-5 w-5" aria-hidden />}
              </button>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="h-12 w-full rounded-lg text-base font-semibold shadow-elevation1">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                Salvando…
              </span>
            ) : (
              "Guardar nova senha"
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthPublicShell>
          <AuthGlassCard>
            <AuthBrandHeader title="Nova senha" subtitle="Carregando…" />
            <div className="flex justify-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
            </div>
          </AuthGlassCard>
          <AuthPublicFooter />
        </AuthPublicShell>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}
