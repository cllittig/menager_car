"use client"

import { usePathname } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"


function isPublicAuthRoute(pathname: string): boolean {
  return (
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password")
  )
}

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return isPublicAuthRoute(pathname) ? (
    children
  ) : (
    <DashboardLayout>{children}</DashboardLayout>
  )
}