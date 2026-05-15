import type { Metadata } from "next"
import { LoginShell } from "./login-shell"

export const metadata: Metadata = {
  title: "Entrar | ManagerCar",
}

export default function LoginPage() {
  return <LoginShell />
}
