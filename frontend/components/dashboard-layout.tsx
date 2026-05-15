"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useApp } from "@/lib/contexts/app-context"
import { AuthService } from "@/lib/services/auth.service"
import { cn } from "@/lib/utils"
import {
    BarChart3,
    Bell,
    Car,
    Check,
    ChevronDown,
    DollarSign,
    FileBarChart,
    FileText,
    LogOut,
    Menu,
    Package,
    Plus,
    Tags,
    Trash2,
    Truck,
    Users,
    Wrench,
    X
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import type React from "react"
import { useEffect, useMemo, useState } from "react"





const MENU_LATERAL_COMPLETO = true

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId?: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  time: string;
  read: boolean;
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { t, language, theme, setLanguage, setTheme } = useApp()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [newMenuOpen, setNewMenuOpen] = useState(false)

  const [layoutMounted, setLayoutMounted] = useState(false)


  const navigation = useMemo(() => {
    const items: { name: string; href: string; icon: typeof Car }[] = [
      { name: t('nav.dashboard'), href: "/", icon: BarChart3 },
      { name: t('nav.vehicles'), href: "/veiculos", icon: Car },
      { name: t('nav.clients'), href: "/clientes", icon: Users },
      { name: t('nav.products'), href: "/produtos", icon: Package },
      { name: t('nav.sales'), href: "/vendas", icon: DollarSign },
      { name: t('nav.maintenance'), href: "/manutencao", icon: Wrench },
      { name: t('nav.contracts'), href: "/contratos", icon: FileText },
      { name: t('nav.reports'), href: "/relatorios", icon: FileBarChart },
    ]
    if (currentUser?.role === 'ADMIN') {
      items.push(
        { name: t('nav.categories'), href: "/categorias", icon: Tags },
        { name: t('nav.suppliers'), href: "/fornecedores", icon: Truck },
      )
    }
    const permitidosMvp = new Set(["/", "/veiculos"])
    if (!layoutMounted) {
      return items.filter((item) => permitidosMvp.has(item.href))
    }
    if (!MENU_LATERAL_COMPLETO) {
      return items.filter((item) => permitidosMvp.has(item.href))
    }
    return items
  }, [t, currentUser?.role, layoutMounted])

  useEffect(() => {
    setLayoutMounted(true)
  }, [])

  useEffect(() => {
    try {
      const authService = new AuthService()
      setCurrentUser(authService.getCurrentUser() ?? null)
    } catch (error) {
      console.error("Erro ao buscar informações do usuário:", error)
    }
  }, [])

  useEffect(() => {
    setNotifications([])
  }, [pathname])

  const handleLogout = async () => {
    try {
      const authService = new AuthService()
      await authService.logout()
      router.replace('/login')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      router.replace('/login')
    }
  }

  const clearAllNotifications = () => {
    setNotifications([])
  }

  const handleLanguageChange = (newLanguage: 'pt' | 'en' | 'es') => {
    setLanguage(newLanguage)
  }

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme)
  }

  const getLanguageDisplay = (lang: string) => {
    switch (lang) {
      case 'pt': return t('language.portuguese')
      case 'en': return t('language.english')
      case 'es': return t('language.spanish')
      default: return lang
    }
  }

  const getThemeDisplay = (currentTheme: string) => {
    return currentTheme === 'light' ? t('theme.light') : t('theme.dark')
  }


  const getUserInitials = (name: string | undefined | null) => {
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return 'US'
    }

    return name
      .trim()
      .split(' ')
      .filter(word => word.length > 0)
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'US'
  }


  const getDisplayName = (fullName: string | undefined | null) => {
    if (!fullName || typeof fullName !== 'string' || fullName.trim() === '') {
      return 'Usuário'
    }

    const parts = fullName.trim().split(' ').filter(part => part.length > 0)

    if (parts.length === 1) {
      return parts[0]
    } else if (parts.length >= 2) {
      return `${parts[0]} ${parts[parts.length - 1]}`
    }

    return fullName
  }

  // Formatar role para exibição
  const formatRole = (role: string | undefined | null) => {
    if (!role || typeof role !== 'string') {
      return 'Usuário'
    }

    switch (role.toUpperCase()) {
      case 'ADMIN':
        return 'Administrador'
      case 'USER':
        return 'Usuário'
      default:
        return role
    }
  }

  const unreadNotifications = notifications.filter(n => !n.read).length

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm lg:hidden",
          sidebarOpen ? "block" : "hidden",
        )}
      >
        <div className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-sidebar-border bg-sidebar shadow-elevation2">
          <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
            <h1 className="truncate text-base font-semibold text-sidebar-foreground">
              {t('system.vehicleSystem')}
            </h1>
            <Button
              id="mobile-menu-close"
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="h-5 w-5" aria-hidden />
              <span className="sr-only">Fechar menu</span>
            </Button>
          </div>
          <nav className="flex flex-col gap-1 p-3">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                prefetch
                className={cn(
                  "focus-ring flex min-w-0 items-center gap-3 rounded-lg border-l-[3px] py-2.5 pl-[calc(0.75rem-3px)] pr-3 text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "border-l-primary bg-sidebar-accent text-sidebar-accent-foreground shadow-elevation1"
                    : "border-l-transparent text-sidebar-foreground/90 hover:bg-sidebar-accent/70",
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="h-5 w-5 shrink-0 opacity-90" aria-hidden />
                <span className="min-w-0 flex-1 truncate">{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex h-screen flex-col border-r border-sidebar-border bg-sidebar shadow-elevation1">
          <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Car className="h-5 w-5" aria-hidden />
            </div>
            <h1 className="truncate text-base font-semibold text-sidebar-foreground">
              {t('system.vehicleSystem')}
            </h1>
          </div>
          <nav className="flex flex-1 flex-col gap-1 p-3">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                prefetch
                className={cn(
                  "focus-ring flex min-w-0 items-center gap-3 rounded-lg border-l-[3px] py-2.5 pl-[calc(0.75rem-3px)] pr-3 text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "border-l-primary bg-sidebar-accent text-sidebar-accent-foreground shadow-elevation1"
                    : "border-l-transparent text-sidebar-foreground/90 hover:bg-sidebar-accent/70",
                )}
              >
                <item.icon className="h-5 w-5 shrink-0 opacity-90" aria-hidden />
                <span className="min-w-0 flex-1 truncate">{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col lg:pl-64">
        {/* Enhanced Header */}
        <div className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border bg-card/95 px-3 shadow-elevation1 backdrop-blur-md supports-[backdrop-filter]:bg-card/80 sm:h-16 sm:gap-4 sm:px-6">
          <Button
            id="mobile-menu-trigger"
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" aria-hidden />
            <span className="sr-only">Abrir menu</span>
          </Button>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <DropdownMenu open={newMenuOpen} onOpenChange={setNewMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  id="new-menu-trigger"
                  className="focus-ring rounded-lg px-3 font-medium shadow-elevation1 sm:px-5"
                >
                  <Plus className="h-4 w-4 sm:mr-2" aria-hidden />
                  <span className="hidden sm:inline">{t('header.new')}</span>
                  <ChevronDown className="h-4 w-4 sm:ml-1" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 sm:w-52">
                <DropdownMenuItem 
                  id="new-vehicle-menu" 
                  className="cursor-pointer" 
                  onClick={() => {setNewMenuOpen(false); router.push('/veiculos')}}
                >
                  <Car className="mr-2 h-4 w-4" />
                  <span>{t('new.vehicle')}</span>
                </DropdownMenuItem>
                {layoutMounted && MENU_LATERAL_COMPLETO && (
                  <>
                <DropdownMenuItem 
                  id="new-client-menu" 
                  className="cursor-pointer" 
                  onClick={() => {setNewMenuOpen(false); router.push('/clientes')}}
                >
                  <Users className="mr-2 h-4 w-4" />
                  <span>{t('new.client')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  id="new-sale-menu" 
                  className="cursor-pointer" 
                  onClick={() => {setNewMenuOpen(false); router.push('/vendas')}}
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  <span>{t('new.sale')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  id="new-contract-menu" 
                  className="cursor-pointer" 
                  onClick={() => {setNewMenuOpen(false); router.push('/contratos')}}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  <span>{t('new.contract')}</span>
                </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Notificações */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  id="notifications-trigger"
                  variant="ghost"
                  size="icon"
                  className="relative rounded-lg"
                >
                  <Bell className="h-5 w-5" aria-hidden />
                  {unreadNotifications > 0 && (
                    <Badge className="notification-pulse absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center border-2 border-card bg-destructive p-0 text-[0.65rem] text-destructive-foreground">
                      {unreadNotifications}
                    </Badge>
                  )}
                  <span className="sr-only">{t('header.notifications')}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 sm:w-80">
                <div className="flex items-center justify-between p-3">
                  <DropdownMenuLabel className="text-base font-semibold p-0">
                    {t('header.notifications')}
                    {unreadNotifications > 0 && (
                      <Badge variant="destructive" className="ml-2 tabular-nums">
                        {unreadNotifications}
                      </Badge>
                    )}
                  </DropdownMenuLabel>
                  {notifications.length > 0 && (
                    <Button 
                      id="clear-notifications"
                      variant="ghost" 
                      size="sm" 
                      onClick={clearAllNotifications}
                      className="text-xs h-auto p-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      {t('header.clearNotifications')}
                    </Button>
                  )}
                </div>
                <DropdownMenuSeparator />
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-sm text-muted-foreground">
                      {t('header.noNotifications')}
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <DropdownMenuItem key={notification.id} className="cursor-pointer flex flex-col items-start p-3">
                        <div className="flex w-full items-start gap-2">
                          <div
                            className={cn(
                              "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                              notification.type === "success" && "bg-success",
                              notification.type === "warning" && "bg-warning",
                              notification.type === "info" && "bg-info",
                            )}
                            aria-hidden
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium text-foreground">{notification.title}</p>
                              <span className="shrink-0 text-caption text-muted-foreground">{notification.time}</span>
                            </div>
                            <p className="mt-1 text-caption text-muted-foreground">{notification.message}</p>
                          </div>
                          {!notification.read && (
                            <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />
                          )}
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Menu do Usuário */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  id="user-menu-trigger"
                  variant="ghost"
                  className="relative h-auto rounded-lg px-2 py-2 sm:px-3"
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Avatar className="h-9 w-9 ring-2 ring-border sm:h-10 sm:w-10">
                      <AvatarImage src="/placeholder-user.jpg" alt="" />
                      <AvatarFallback className="bg-primary text-sm font-semibold text-primary-foreground">
                        {getUserInitials(currentUser?.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:flex sm:flex-col sm:items-start">
                      <span className="text-sm font-semibold text-foreground">
                        {getDisplayName(currentUser?.name)}
                      </span>
                      <span className="text-caption text-muted-foreground">{formatRole(currentUser?.role)}</span>
                    </div>
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 sm:w-64">
                <DropdownMenuLabel className="pb-2">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="/placeholder-user.jpg" alt="Avatar" />
                      <AvatarFallback className="bg-primary font-semibold text-primary-foreground">
                        {getUserInitials(currentUser?.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <p className="text-sm font-semibold leading-none">
                        {currentUser?.name?.trim() || 'Usuário'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground mt-1">
                        {currentUser?.email?.trim() || 'carregando@email.com'}
                      </p>
                      <Badge variant="outline" className="mt-2 text-xs w-fit">
                        {formatRole(currentUser?.role)}
                      </Badge>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-3 pb-1">
                  {t('user.systemPreferences')}
                </DropdownMenuLabel>

                {/* Seletor de Idioma */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <DropdownMenuItem id="language-selector-trigger" className="cursor-pointer">
                      <div className="flex items-center justify-between w-full">
                        <span className="text-sm">{t('user.language')}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">{getLanguageDisplay(language)}</span>
                          <ChevronDown className="h-3 w-3" />
                        </div>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    side="left" 
                    align="start" 
                    className="w-36 sm:w-48"
                    sideOffset={4}
                    alignOffset={0}
                    avoidCollisions={true}
                    collisionPadding={16}
                  >
                    <DropdownMenuItem 
                      id="language-pt-dashboard" 
                      className="cursor-pointer" 
                      onClick={() => handleLanguageChange('pt')}
                    >
                      <span className="text-sm">{t('language.portuguese')}</span>
                      {language === 'pt' && <Badge variant="secondary" className="ml-auto text-xs p-1"><Check className="h-3 w-3" aria-hidden /></Badge>}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      id="language-en-dashboard" 
                      className="cursor-pointer" 
                      onClick={() => handleLanguageChange('en')}
                    >
                      <span className="text-sm">{t('language.english')}</span>
                      {language === 'en' && <Badge variant="secondary" className="ml-auto text-xs p-1"><Check className="h-3 w-3" aria-hidden /></Badge>}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      id="language-es-dashboard" 
                      className="cursor-pointer" 
                      onClick={() => handleLanguageChange('es')}
                    >
                      <span className="text-sm">{t('language.spanish')}</span>
                      {language === 'es' && <Badge variant="secondary" className="ml-auto text-xs p-1"><Check className="h-3 w-3" aria-hidden /></Badge>}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Seletor de Tema */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <DropdownMenuItem id="theme-selector-trigger" className="cursor-pointer">
                      <div className="flex items-center justify-between w-full">
                        <span className="text-sm">{t('user.theme')}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">{getThemeDisplay(theme)}</span>
                          <ChevronDown className="h-3 w-3" />
                        </div>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    side="left" 
                    align="start" 
                    className="w-24 sm:w-32"
                    sideOffset={4}
                    alignOffset={0}
                    avoidCollisions={true}
                    collisionPadding={16}
                  >
                    <DropdownMenuItem 
                      id="theme-light-dashboard" 
                      className="cursor-pointer" 
                      onClick={() => handleThemeChange('light')}
                    >
                      <span className="text-sm">{t('theme.light')}</span>
                      {theme === 'light' && <Badge variant="secondary" className="ml-auto text-xs p-1"><Check className="h-3 w-3" aria-hidden /></Badge>}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      id="theme-dark-dashboard" 
                      className="cursor-pointer" 
                      onClick={() => handleThemeChange('dark')}
                    >
                      <span className="text-sm">{t('theme.dark')}</span>
                      {theme === 'dark' && <Badge variant="secondary" className="ml-auto text-xs p-1"><Check className="h-3 w-3" aria-hidden /></Badge>}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  id="logout-dashboard" 
                  onClick={handleLogout} 
                  className="text-red-600 focus:text-red-600 cursor-pointer"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  <span>{t('user.logout')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <main className="flex-1 bg-background p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
