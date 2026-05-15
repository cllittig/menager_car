"use client"

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
} from "react"

type Language = 'pt' | 'en' | 'es'
type Theme = 'light' | 'dark'

interface AppContextType {
  language: Language
  theme: Theme
  setLanguage: (language: Language) => void
  setTheme: (theme: Theme) => void
  t: (key: string) => string
}

const AppContext = createContext<AppContextType | undefined>(undefined)


const translations: Record<Language, Record<string, string>> = {
  pt: {

    'currency.symbol': 'R$',
    'currency.name': 'Real',
    'currency.code': 'BRL',


    'header.new': 'Novo',
    'header.notifications': 'Notificações',
    'header.clearNotifications': 'Limpar todas',
    'header.noNotifications': 'Nenhuma notificação',


    'user.systemPreferences': 'Preferências do Sistema',
    'user.language': 'Idioma',
    'user.theme': 'Tema',
    'user.logout': 'Sair do Sistema',


    'language.portuguese': 'Português (BR)',
    'language.english': 'English (US)',
    'language.spanish': 'Español (ES)',


    'theme.light': 'Claro',
    'theme.dark': 'Escuro',


    'new.vehicle': 'Novo Veículo',
    'new.client': 'Novo Cliente',
    'new.sale': 'Nova Venda',
    'new.contract': 'Novo Contrato',


    'dashboard.title': 'Dashboard',
    'dashboard.overview': 'Visão geral do negócio',


    'nav.dashboard': 'Dashboard',
    'nav.vehicles': 'Veículos',
    'nav.clients': 'Clientes',
    'nav.sales': 'Vendas',
    'nav.maintenance': 'Manutenção',
    'nav.contracts': 'Contratos',
    'nav.products': 'Produtos / Estoque',
    'nav.reports': 'Relatórios',
    'nav.categories': 'Categorias',
    'nav.suppliers': 'Fornecedores',


    'system.vehicleSystem': 'ManagerCar',
    'system.loading': 'Carregando...',
    'system.error': 'Erro',


    'login.title': 'ManagerCar',
    'login.subtitle': 'Digite suas credenciais para acessar o sistema',
    'login.email': 'Email',
    'login.password': 'Senha',
    'login.loginButton': 'Entrar',
    'login.loginButtonLoading': 'Entrando...',
    'login.noAccount': 'Não tem uma conta?',
    'login.register': 'Cadastre-se',
    'login.error': 'Erro',
    'login.toastValidationTitle': 'Dados incompletos',
    'login.toastWrongLoginTitle': 'E-mail ou senha incorretos',
    'login.toastWrongLoginDescription':
      'Confira o e-mail e a senha. Se esqueceu a senha, use o link «Esqueci minha senha».',
    'login.toastRateLimitTitle': 'Muitas tentativas',
    'login.toastRateLimitDescription':
      'Por segurança, o limite de tentativas foi atingido. Aguarde alguns minutos e tente novamente.',
    'login.toastUnavailableTitle': 'Serviço indisponível',
    'login.toastUnavailableDescription':
      'Não foi possível conectar ao servidor. Verifique sua internet ou se o sistema está no ar e tente de novo.',
    'login.toastGenericFailTitle': 'Não foi possível entrar',
    'login.fillFields': 'Preencha email e senha',
    'login.success': 'Login realizado com sucesso!',
    'login.redirecting': 'Redirecionando para o dashboard...',
    'login.invalidCredentials': 'Credenciais inválidas',
    'login.loginError': 'Erro de login',
    'login.serverError': 'Erro no servidor',
    'login.connectionError': 'Erro de conexão',
    'login.backendNotRunning': 'Backend não está respondendo. Verifique se está rodando na porta 3005.',
    'login.selectLanguage': 'Selecionar idioma',


    'register.title': 'Criar Conta',
    'register.subtitle': 'Preencha os dados para criar sua conta',
    'register.name': 'Nome',
    'register.companyName': 'Nome da empresa (concessionária)',
    'register.companyNameHint':
      'Opcional. Se preenchido, o nome da empresa ou concessionária fica associado à sua conta.',
    'register.namePlaceholder': 'Seu nome completo',
    'register.email': 'Email',
    'register.password': 'Senha',
    'register.registerButton': 'Cadastrar',
    'register.registerButtonLoading': 'Cadastrando...',
    'register.hasAccount': 'Já tem uma conta?',
    'register.login': 'Faça login',
    'register.error': 'Erro',
    'register.fillFields': 'Preencha todos os campos',
    'register.success': 'Sucesso',
    'register.successMessage': 'Cadastro realizado com sucesso',
    'register.registerError': 'Erro ao cadastrar',
    'register.serverError': 'Erro no servidor',
    'register.passwordConfirm': 'Confirmar senha',
    'register.passwordConfirmHint': 'Digite novamente a mesma senha do campo acima.',
    'register.passwordConfirmPlaceholder': 'Repita a senha',
    'register.passwordMismatch': 'As senhas não coincidem',
    'register.confirmRequired': 'Confirme sua senha',
    'register.fixValidation': 'Corrija os erros do formulário antes de enviar',
    'register.emailTakenTitle': 'E-mail já cadastrado',
    'register.emailTakenDescription':
      'Este endereço já possui uma conta. Entre com seu e-mail e senha na página de login ou use outro e-mail.',
    'register.emailTakenInline': 'Este e-mail já está em uso. Faça login ou escolha outro.',
    'register.toastValidationTitle': 'Revise o formulário',
    'register.toastSignupFailedTitle': 'Cadastro não concluído',
    'register.toastRateLimitTitle': 'Muitas tentativas',
    'register.toastRateLimitDescription':
      'Por segurança, o limite de tentativas foi atingido. Aguarde alguns minutos e tente novamente.',
    'register.toastUnavailableTitle': 'Serviço indisponível',
    'register.toastUnavailableDescription':
      'Não foi possível conectar ao servidor. Tente novamente em instantes.',
    'register.passwordStrengthPrefix': 'Força da senha:',
    'register.strengthVeryWeak': 'Muito fraca',
    'register.strengthWeak': 'Fraca',
    'register.strengthFair': 'Regular',
    'register.strengthGood': 'Boa',
    'register.strengthStrong': 'Forte',


    'dashboard.financialSummary': 'Resumo Financeiro do Mês',
    'dashboard.financialDescription': 'Análise completa de receitas, despesas e lucratividade',
    'dashboard.revenue': 'Receita',
    'dashboard.expenses': 'Despesas',
    'dashboard.profit': 'Lucro',
    'dashboard.margin': 'Margem',
    'dashboard.grossRevenue': 'Faturamento bruto',
    'dashboard.vehiclesMaintenance': 'Veículos + Manutenção',
    'dashboard.profitability': 'Rentabilidade',
    'dashboard.stockStatus': 'Status do Estoque',
    'dashboard.stockDescription': 'Distribuição atual dos veículos',
    'dashboard.totalVehicles': 'Total de Veículos',
    'dashboard.available': 'Disponíveis',
    'dashboard.soldThisMonth': 'Vendidos este mês',
    'dashboard.inMaintenance': 'Em manutenção',
    'dashboard.availabilityRate': 'Taxa de disponibilidade',
    'dashboard.operationalIndicators': 'Indicadores Operacionais',
    'dashboard.operationalDescription': 'Métricas de performance e operação',
    'dashboard.totalClients': 'Total de Clientes',
    'dashboard.salesThisMonth': 'Vendas do Mês',
    'dashboard.averageTicket': 'Ticket médio de venda',
    'dashboard.registeredContracts': 'Contratos registrados',
    'dashboard.maintenanceCosts': 'Gastos com manutenção',
    'dashboard.units': 'unidades',
    'dashboard.documents': 'documentos',
    'dashboard.vehiclesInMaintenance': 'Atenção - Veículos em Manutenção',
    'dashboard.vehiclesInMaintenanceDesc': 'estão em manutenção e não disponíveis para venda. Isso representa',
    'dashboard.ofStock': 'do seu estoque.',
    'dashboard.monthlyLoss': 'Atenção - Prejuízo no Mês',
    'dashboard.monthlyLossDesc': 'O mês está com prejuízo de',
    'dashboard.monthlyLossAdvice': 'Revise os custos ou intensifique as vendas para reverter este cenário.',
    'dashboard.profitLabel': 'Lucro',
    'dashboard.lossLabel': 'Prejuízo',
    'dashboard.insightsTitle': 'Visões estratégicas',
    'dashboard.insightsSubtitle':
      'Marca/modelo mais vendido nas transações e tendência de faturamento (vendas não canceladas).',
    'dashboard.openInventory': 'Abrir inventário',
    'dashboard.kpiRotation': 'Ritmo do mês',
    'dashboard.kpiRotationDesc': 'Vendas do mês em relação ao total de veículos na base',
    'dashboard.kpiLifetimeRevenue': 'Receita acumulada (vendas)',
    'dashboard.kpiLifetimeRevenueDesc': 'Soma histórica de vendas contabilizadas',
    'dashboard.kpiMaintenancePressure': 'Pressão de oficina',
    'dashboard.kpiMaintenancePressureDesc': 'Veículos em manutenção face à frota',
    'dashboard.kpiSpread': 'Spread médio',
    'dashboard.kpiSpreadDesc': 'Ticket médio de venda menos média de compra',
    'dashboard.revenue6mTitle': 'Receita de vendas (6 meses)',
    'dashboard.revenue6mDesc': 'Faturamento por mês calendário',
    'dashboard.topSoldTitle': 'Modelo em destaque',
    'dashboard.topSoldSubtitle': 'Marca e modelo com mais vendas registradas',
    'dashboard.topSoldEmpty': 'Ainda não há vendas contabilizadas para destacar um modelo.',
  },
  en: {

    'currency.symbol': '$',
    'currency.name': 'Dollar',
    'currency.code': 'USD',


    'header.new': 'New',
    'header.notifications': 'Notifications',
    'header.clearNotifications': 'Clear all',
    'header.noNotifications': 'No notifications',


    'user.systemPreferences': 'System Preferences',
    'user.language': 'Language',
    'user.theme': 'Theme',
    'user.logout': 'Sign Out',


    'language.portuguese': 'Português (BR)',
    'language.english': 'English (US)',
    'language.spanish': 'Español (ES)',


    'theme.light': 'Light',
    'theme.dark': 'Dark',


    'new.vehicle': 'New Vehicle',
    'new.client': 'New Client',
    'new.sale': 'New Sale',
    'new.contract': 'New Contract',


    'dashboard.title': 'Dashboard',
    'dashboard.overview': 'Business overview',


    'nav.dashboard': 'Dashboard',
    'nav.vehicles': 'Vehicles',
    'nav.clients': 'Clients',
    'nav.sales': 'Sales',
    'nav.maintenance': 'Maintenance',
    'nav.contracts': 'Contracts',
    'nav.products': 'Products / Stock',
    'nav.reports': 'Reports',
    'nav.categories': 'Categories',
    'nav.suppliers': 'Suppliers',


    'system.vehicleSystem': 'ManagerCar',
    'system.loading': 'Loading...',
    'system.error': 'Error',


    'login.title': 'ManagerCar',
    'login.subtitle': 'Enter your credentials to access the system',
    'login.email': 'Email',
    'login.password': 'Password',
    'login.loginButton': 'Sign In',
    'login.loginButtonLoading': 'Signing in...',
    'login.noAccount': "Don't have an account?",
    'login.register': 'Sign Up',
    'login.error': 'Error',
    'login.toastValidationTitle': 'Missing information',
    'login.toastWrongLoginTitle': 'Incorrect email or password',
    'login.toastWrongLoginDescription':
      'Check your email and password. If you forgot your password, use «Forgot password».',
    'login.toastRateLimitTitle': 'Too many attempts',
    'login.toastRateLimitDescription':
      'For your security, the attempt limit was reached. Please wait a few minutes and try again.',
    'login.toastUnavailableTitle': 'Service unavailable',
    'login.toastUnavailableDescription':
      'Could not reach the server. Check your connection and try again.',
    'login.toastGenericFailTitle': 'Sign-in failed',
    'login.fillFields': 'Please fill in email and password',
    'login.success': 'Login successful!',
    'login.redirecting': 'Redirecting to dashboard...',
    'login.invalidCredentials': 'Invalid credentials',
    'login.loginError': 'Login error',
    'login.serverError': 'Server error',
    'login.connectionError': 'Connection error',
    'login.backendNotRunning': 'Backend is not responding. Check if it is running on port 3005.',
    'login.selectLanguage': 'Select language',


    'register.title': 'Create Account',
    'register.subtitle': 'Fill in the data to create your account',
    'register.name': 'Name',
    'register.companyName': 'Company (dealership) name',
    'register.companyNameHint':
      'Optional. If filled in, your dealership or company name is linked to your account.',
    'register.namePlaceholder': 'Your full name',
    'register.email': 'Email',
    'register.password': 'Password',
    'register.registerButton': 'Sign Up',
    'register.registerButtonLoading': 'Signing up...',
    'register.hasAccount': 'Already have an account?',
    'register.login': 'Sign in',
    'register.error': 'Error',
    'register.fillFields': 'Please fill in all fields',
    'register.success': 'Success',
    'register.successMessage': 'Registration completed successfully',
    'register.registerError': 'Registration error',
    'register.serverError': 'Server error',
    'register.passwordConfirm': 'Confirm password',
    'register.passwordConfirmHint': 'Enter the same password as above.',
    'register.passwordConfirmPlaceholder': 'Repeat password',
    'register.passwordMismatch': 'Passwords do not match',
    'register.confirmRequired': 'Please confirm your password',
    'register.fixValidation': 'Fix the form errors before submitting',
    'register.emailTakenTitle': 'Email already registered',
    'register.emailTakenDescription':
      'This address already has an account. Sign in on the login page or use a different email.',
    'register.emailTakenInline': 'This email is already in use. Sign in or choose another.',
    'register.toastValidationTitle': 'Please review the form',
    'register.toastSignupFailedTitle': 'Registration could not be completed',
    'register.toastRateLimitTitle': 'Too many attempts',
    'register.toastRateLimitDescription':
      'For your security, the attempt limit was reached. Please wait a few minutes and try again.',
    'register.toastUnavailableTitle': 'Service unavailable',
    'register.toastUnavailableDescription':
      'Could not reach the server. Please try again in a moment.',
    'register.passwordStrengthPrefix': 'Password strength:',
    'register.strengthVeryWeak': 'Very weak',
    'register.strengthWeak': 'Weak',
    'register.strengthFair': 'Fair',
    'register.strengthGood': 'Good',
    'register.strengthStrong': 'Strong',


    'dashboard.financialSummary': 'Monthly Financial Summary',
    'dashboard.financialDescription': 'Complete analysis of revenue, expenses and profitability',
    'dashboard.revenue': 'Revenue',
    'dashboard.expenses': 'Expenses',
    'dashboard.profit': 'Profit',
    'dashboard.margin': 'Margin',
    'dashboard.grossRevenue': 'Gross revenue',
    'dashboard.vehiclesMaintenance': 'Vehicles + Maintenance',
    'dashboard.profitability': 'Profitability',
    'dashboard.stockStatus': 'Stock Status',
    'dashboard.stockDescription': 'Current vehicle distribution',
    'dashboard.totalVehicles': 'Total Vehicles',
    'dashboard.available': 'Available',
    'dashboard.soldThisMonth': 'Sold this month',
    'dashboard.inMaintenance': 'In maintenance',
    'dashboard.availabilityRate': 'Availability rate',
    'dashboard.operationalIndicators': 'Operational Indicators',
    'dashboard.operationalDescription': 'Performance and operation metrics',
    'dashboard.totalClients': 'Total Clients',
    'dashboard.salesThisMonth': 'Sales this Month',
    'dashboard.averageTicket': 'Average sales ticket',
    'dashboard.registeredContracts': 'Registered contracts',
    'dashboard.maintenanceCosts': 'Maintenance costs',
    'dashboard.units': 'units',
    'dashboard.documents': 'documents',
    'dashboard.vehiclesInMaintenance': 'Warning - Vehicles in Maintenance',
    'dashboard.vehiclesInMaintenanceDesc': 'are in maintenance and not available for sale. This represents',
    'dashboard.ofStock': 'of your stock.',
    'dashboard.monthlyLoss': 'Warning - Monthly Loss',
    'dashboard.monthlyLossDesc': 'The month has a loss of',
    'dashboard.monthlyLossAdvice': 'Review costs or intensify sales to reverse this scenario.',
    'dashboard.profitLabel': 'Profit',
    'dashboard.lossLabel': 'Loss',
    'dashboard.insightsTitle': 'Strategic views',
    'dashboard.insightsSubtitle':
      'Top-selling make/model from transactions and revenue trend (non-cancelled sales).',
    'dashboard.openInventory': 'Open inventory',
    'dashboard.kpiRotation': 'Monthly pace',
    'dashboard.kpiRotationDesc': 'This month’s sales vs. total vehicles on file',
    'dashboard.kpiLifetimeRevenue': 'Lifetime sales revenue',
    'dashboard.kpiLifetimeRevenueDesc': 'All-time recognised sales',
    'dashboard.kpiMaintenancePressure': 'Workshop pressure',
    'dashboard.kpiMaintenancePressureDesc': 'Vehicles in maintenance vs. fleet size',
    'dashboard.kpiSpread': 'Average spread',
    'dashboard.kpiSpreadDesc': 'Average sale ticket minus average purchase',
    'dashboard.revenue6mTitle': 'Sales revenue (6 months)',
    'dashboard.revenue6mDesc': 'Revenue by calendar month',
    'dashboard.topSoldTitle': 'Top model',
    'dashboard.topSoldSubtitle': 'Make and model with the most sales recorded',
    'dashboard.topSoldEmpty': 'No recognised sales yet to highlight a model.',
  },
  es: {

    'currency.symbol': '€',
    'currency.name': 'Euro',
    'currency.code': 'EUR',


    'header.new': 'Nuevo',
    'header.notifications': 'Notificaciones',
    'header.clearNotifications': 'Limpiar todas',
    'header.noNotifications': 'Sin notificaciones',


    'user.systemPreferences': 'Preferencias del Sistema',
    'user.language': 'Idioma',
    'user.theme': 'Tema',
    'user.logout': 'Cerrar Sesión',


    'language.portuguese': 'Português (BR)',
    'language.english': 'English (US)',
    'language.spanish': 'Español (ES)',


    'theme.light': 'Claro',
    'theme.dark': 'Oscuro',


    'new.vehicle': 'Nuevo Vehículo',
    'new.client': 'Nuevo Cliente',
    'new.sale': 'Nueva Venta',
    'new.contract': 'Nuevo Contrato',


    'dashboard.title': 'Panel',
    'dashboard.overview': 'Resumen del negocio',


    'nav.dashboard': 'Panel',
    'nav.vehicles': 'Vehículos',
    'nav.clients': 'Clientes',
    'nav.sales': 'Ventas',
    'nav.maintenance': 'Mantenimiento',
    'nav.contracts': 'Contratos',
    'nav.products': 'Productos / Inventario',
    'nav.reports': 'Informes',
    'nav.categories': 'Categorías',
    'nav.suppliers': 'Proveedores',


    'system.vehicleSystem': 'ManagerCar',
    'system.loading': 'Cargando...',
    'system.error': 'Error',


    'login.title': 'ManagerCar',
    'login.subtitle': 'Ingrese sus credenciales para acceder al sistema',
    'login.email': 'Correo',
    'login.password': 'Contraseña',
    'login.loginButton': 'Iniciar Sesión',
    'login.loginButtonLoading': 'Iniciando...',
    'login.noAccount': '¿No tienes una cuenta?',
    'login.register': 'Registrarse',
    'login.error': 'Error',
    'login.toastValidationTitle': 'Datos incompletos',
    'login.toastWrongLoginTitle': 'Correo o contraseña incorrectos',
    'login.toastWrongLoginDescription':
      'Revise el correo y la contraseña. Si olvidó la contraseña, use «Olvidé mi contraseña».',
    'login.toastRateLimitTitle': 'Demasiados intentos',
    'login.toastRateLimitDescription':
      'Por seguridad, se alcanzó el límite de intentos. Espere unos minutos e inténtelo de nuevo.',
    'login.toastUnavailableTitle': 'Servicio no disponible',
    'login.toastUnavailableDescription':
      'No se pudo conectar al servidor. Compruebe su conexión e inténtelo de nuevo.',
    'login.toastGenericFailTitle': 'No se pudo iniciar sesión',
    'login.fillFields': 'Complete el correo y la contraseña',
    'login.success': '¡Inicio de sesión exitoso!',
    'login.redirecting': 'Redirigiendo al panel...',
    'login.invalidCredentials': 'Credenciales inválidas',
    'login.loginError': 'Error de inicio de sesión',
    'login.serverError': 'Error del servidor',
    'login.connectionError': 'Error de conexión',
    'login.backendNotRunning': 'El backend no responde. Verifique si está ejecutándose en el puerto 3005.',
    'login.selectLanguage': 'Seleccionar idioma',


    'register.title': 'Crear Cuenta',
    'register.subtitle': 'Complete los datos para crear su cuenta',
    'register.name': 'Nombre',
    'register.companyName': 'Nombre de la empresa (concesionaria)',
    'register.companyNameHint':
      'Opcional. Si lo completa, el nombre de la empresa o concesión queda asociado a su cuenta.',
    'register.namePlaceholder': 'Su nombre completo',
    'register.email': 'Correo',
    'register.password': 'Contraseña',
    'register.registerButton': 'Registrarse',
    'register.registerButtonLoading': 'Registrando...',
    'register.hasAccount': '¿Ya tienes una cuenta?',
    'register.login': 'Iniciar sesión',
    'register.error': 'Error',
    'register.fillFields': 'Complete todos los campos',
    'register.success': 'Éxito',
    'register.successMessage': 'Registro completado exitosamente',
    'register.registerError': 'Error de registro',
    'register.serverError': 'Error del servidor',
    'register.passwordConfirm': 'Confirmar contraseña',
    'register.passwordConfirmHint': 'Escriba de nuevo la misma contraseña del campo anterior.',
    'register.passwordConfirmPlaceholder': 'Repita la contraseña',
    'register.passwordMismatch': 'Las contraseñas no coinciden',
    'register.confirmRequired': 'Confirme su contraseña',
    'register.fixValidation': 'Corrija los errores del formulario antes de enviar',
    'register.emailTakenTitle': 'Correo ya registrado',
    'register.emailTakenDescription':
      'Esta dirección ya tiene una cuenta. Inicie sesión en la página de acceso o use otro correo.',
    'register.emailTakenInline': 'Este correo ya está en uso. Inicie sesión o elija otro.',
    'register.toastValidationTitle': 'Revise el formulario',
    'register.toastSignupFailedTitle': 'No se pudo completar el registro',
    'register.toastRateLimitTitle': 'Demasiados intentos',
    'register.toastRateLimitDescription':
      'Por seguridad, se alcanzó el límite de intentos. Espere unos minutos e inténtelo de nuevo.',
    'register.toastUnavailableTitle': 'Servicio no disponible',
    'register.toastUnavailableDescription':
      'No se pudo conectar al servidor. Inténtelo de nuevo en unos instantes.',
    'register.passwordStrengthPrefix': 'Fortaleza de la contraseña:',
    'register.strengthVeryWeak': 'Muy débil',
    'register.strengthWeak': 'Débil',
    'register.strengthFair': 'Regular',
    'register.strengthGood': 'Buena',
    'register.strengthStrong': 'Fuerte',


    'dashboard.financialSummary': 'Resumen Financiero del Mes',
    'dashboard.financialDescription': 'Análisis completo de ingresos, gastos y rentabilidad',
    'dashboard.revenue': 'Ingresos',
    'dashboard.expenses': 'Gastos',
    'dashboard.profit': 'Ganancia',
    'dashboard.margin': 'Margen',
    'dashboard.grossRevenue': 'Facturación bruta',
    'dashboard.vehiclesMaintenance': 'Vehículos + Mantenimiento',
    'dashboard.profitability': 'Rentabilidad',
    'dashboard.stockStatus': 'Estado del Inventario',
    'dashboard.stockDescription': 'Distribución actual de vehículos',
    'dashboard.totalVehicles': 'Total de Vehículos',
    'dashboard.available': 'Disponibles',
    'dashboard.soldThisMonth': 'Vendidos este mes',
    'dashboard.inMaintenance': 'En mantenimiento',
    'dashboard.availabilityRate': 'Tasa de disponibilidad',
    'dashboard.operationalIndicators': 'Indicadores Operacionales',
    'dashboard.operationalDescription': 'Métricas de rendimiento y operación',
    'dashboard.totalClients': 'Total de Clientes',
    'dashboard.salesThisMonth': 'Ventas del Mes',
    'dashboard.averageTicket': 'Ticket promedio de venta',
    'dashboard.registeredContracts': 'Contratos registrados',
    'dashboard.maintenanceCosts': 'Gastos de mantenimiento',
    'dashboard.units': 'unidades',
    'dashboard.documents': 'documentos',
    'dashboard.vehiclesInMaintenance': 'Atención - Vehículos en Mantenimiento',
    'dashboard.vehiclesInMaintenanceDesc': 'están en mantenimiento y no disponibles para venta. Esto representa',
    'dashboard.ofStock': 'de su inventario.',
    'dashboard.monthlyLoss': 'Atención - Pérdida Mensual',
    'dashboard.monthlyLossDesc': 'El mes tiene una pérdida de',
    'dashboard.monthlyLossAdvice': 'Revise los costos o intensifique las ventas para revertir este escenario.',
    'dashboard.profitLabel': 'Ganancia',
    'dashboard.lossLabel': 'Pérdida',
    'dashboard.insightsTitle': 'Vistas estratégicas',
    'dashboard.insightsSubtitle':
      'Marca/modelo más vendido en transacciones y tendencia de facturación (ventas no canceladas).',
    'dashboard.openInventory': 'Abrir inventario',
    'dashboard.kpiRotation': 'Ritmo del mes',
    'dashboard.kpiRotationDesc': 'Ventas del mes respecto al total de vehículos en base',
    'dashboard.kpiLifetimeRevenue': 'Ingresos acumulados (ventas)',
    'dashboard.kpiLifetimeRevenueDesc': 'Suma histórica de ventas reconocidas',
    'dashboard.kpiMaintenancePressure': 'Presión del taller',
    'dashboard.kpiMaintenancePressureDesc': 'Vehículos en mantenimiento frente a la flota',
    'dashboard.kpiSpread': 'Spread medio',
    'dashboard.kpiSpreadDesc': 'Ticket medio de venta menos media de compra',
    'dashboard.revenue6mTitle': 'Ingresos por ventas (6 meses)',
    'dashboard.revenue6mDesc': 'Facturación por mes calendario',
    'dashboard.topSoldTitle': 'Modelo destacado',
    'dashboard.topSoldSubtitle': 'Marca y modelo con más ventas registradas',
    'dashboard.topSoldEmpty': 'Aún no hay ventas reconocidas para destacar un modelo.',
  },
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("pt")
  const [theme, setThemeState] = useState<Theme>("light")





  useLayoutEffect(() => {
    try {
      const savedLang = localStorage.getItem("app-language") as Language | null
      if (savedLang && ["pt", "en", "es"].includes(savedLang)) {
        setLanguageState(savedLang)
      }
      const savedTheme = localStorage.getItem("app-theme") as Theme | null
      if (savedTheme === "dark") {
        setThemeState("dark")
      } else {
        setThemeState("light")
      }
    } catch {

    }
  }, [])

  useEffect(() => {
    const root = document.documentElement
    const body = document.body
    if (theme === "dark") {
      root.classList.add("dark")
      body.classList.add("dark")
    } else {
      root.classList.remove("dark")
      body.classList.remove("dark")
    }
  }, [theme])

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage)
    localStorage.setItem('app-language', newLanguage)
  }

  const setTheme = useCallback((newTheme: Theme) => {

    setThemeState(newTheme)
    localStorage.setItem('app-theme', newTheme)
  }, [])

  const t = (key: string): string => {
    return translations[language][key] ?? key
  }

  return (
    <AppContext.Provider value={{
      language,
      theme,
      setLanguage,
      setTheme,
      t
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
} 