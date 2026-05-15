import { AccessGeoTelemetry } from "@/components/access-geo-telemetry"
import { ClientLayout } from "@/components/client-layout"
import { PWAProvider } from "@/components/pwa-provider"
import { Toaster } from "@/components/ui/toaster"
import { AppProvider } from "@/lib/contexts/app-context"
import { QueryProvider } from "@/lib/providers/query-provider"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { headers } from "next/headers"
import Script from "next/script"
import type React from "react"
import "../styles/globals.css"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
  variable: "--font-inter",
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: "ManagerCar",
  description: "Gestão de veículos, vendas e oficina",
  generator: 'v0.dev',
  keywords: ['ManagerCar', 'gestão', 'veículos', 'vendas', 'manutenção', 'concessionária'],
  robots: {
    index: false,
    follow: false,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ManagerCar'
  },
  openGraph: {
    title: 'ManagerCar',
    description: 'Gestão de veículos, clientes e operações',
    type: 'website',
    siteName: 'ManagerCar'
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' }
  ]
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const headersList = await headers()
  const apiPort = process.env.NEXT_PUBLIC_API_PORT || "3005"
  const forwardedProto = headersList.get("x-forwarded-proto")
  const protocol =
    forwardedProto === "https" || forwardedProto === "http"
      ? `${forwardedProto}:`
      : "http:"
  const host =
    headersList.get("x-forwarded-host") ??
    headersList.get("host") ??
    "localhost:3000"
  const hostname = host.split(":")[0] ?? "localhost"
  const apiOrigin = `${protocol}//${hostname}:${apiPort}`

  return (
    <html lang="pt-BR" className={`h-full ${inter.variable}`} suppressHydrationWarning>
      <head>
        {/* Preconnect à API no mesmo host que a página (localhost, LAN ou IP público) */}
        <link rel="dns-prefetch" href={apiOrigin} />
        <link rel="preconnect" href={apiOrigin} />

        {/* Meta tags para performance */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body
        className={`${inter.variable} ${inter.className} min-h-screen font-sans`}
        suppressHydrationWarning
      >
        <Script
          id="app-theme-boot"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('app-theme');if(t==='dark')document.documentElement.classList.add('dark');else document.documentElement.classList.remove('dark');}catch(e){document.documentElement.classList.remove('dark');}})()",
          }}
        />
        <PWAProvider>
          <QueryProvider>
            <AppProvider>
              <ClientLayout>{children}</ClientLayout>
              <AccessGeoTelemetry />
              <Toaster />
            </AppProvider>
          </QueryProvider>
        </PWAProvider>
      </body>
    </html>
  )
}
