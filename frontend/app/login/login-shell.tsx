"use client"

import dynamic from "next/dynamic"

const LoginClientPage = dynamic(() => import("./login-client"), {
  ssr: false,
  loading: () => (
    <div
      className="flex min-h-[50vh] items-center justify-center bg-background"
      aria-busy="true"
      aria-label="Carregando"
    >
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  ),
})

export function LoginShell() {
  return <LoginClientPage />
}
