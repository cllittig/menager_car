import { getFrontendApiBaseUrl } from './env'












export function getApiBaseUrl(): string {
  return getFrontendApiBaseUrl()
}

const u = (path: string) =>
  `${getApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`

export const API_ROUTES = {
  auth: {
    get login() {
      return u('/auth/login')
    },
    get forgotPassword() {
      return u('/auth/forgot-password')
    },
    get resetPassword() {
      return u('/auth/reset-password')
    },
    get syncPasswordFromRecovery() {
      return u('/auth/sync-password-from-recovery')
    },
  },
  usuario: {
    get create() {
      return u('/usuario')
    },
    get getAll() {
      return u('/usuario')
    },
    getOne: (id: string) => u(`/usuario/${id}`),
    update: (id: string) => u(`/usuario/${id}`),
    delete: (id: string) => u(`/usuario/${id}`),
  },
  vehicles: {
    get create() {
      return u('/vehicles')
    },
    get getAll() {
      return u('/vehicles')
    },
    getOne: (id: string) => u(`/vehicles/${id}`),
    update: (id: string) => u(`/vehicles/${id}`),
    delete: (id: string) => u(`/vehicles/${id}`),
  },
  clients: {
    get create() {
      return u('/clients')
    },
    get getAll() {
      return u('/clients')
    },
    getOne: (id: string) => u(`/clients/${id}`),
    update: (id: string) => u(`/clients/${id}`),
    delete: (id: string) => u(`/clients/${id}`),
    get stats() {
      return u('/clients/stats')
    },
  },
  sales: {
    get create() {
      return u('/sales')
    },
    get getAll() {
      return u('/sales')
    },
    getOne: (id: string) => u(`/sales/${id}`),
    update: (id: string) => u(`/sales/${id}`),
    delete: (id: string) => u(`/sales/${id}`),
    get stats() {
      return u('/sales/stats')
    },
    get pendingPayments() {
      return u('/sales/pending-payments')
    },
  },
  maintenance: {
    get create() {
      return u('/maintenance')
    },
    get getAll() {
      return u('/maintenance')
    },
    getOne: (id: string) => u(`/maintenance/${id}`),
    update: (id: string) => u(`/maintenance/${id}`),
    delete: (id: string) => u(`/maintenance/${id}`),
    get stats() {
      return u('/maintenance/stats')
    },
    byVehicle: (vehicleId: string) => u(`/maintenance/vehicle/${vehicleId}`),
  },
  contracts: {
    get create() {
      return u('/contracts')
    },
    get getAll() {
      return u('/contracts')
    },
    getOne: (id: string) => u(`/contracts/${id}`),
    update: (id: string) => u(`/contracts/${id}`),
    download: (id: string) => u(`/contracts/${id}/download`),
    delete: (id: string) => u(`/contracts/${id}`),
    get stats() {
      return u('/contracts/stats')
    },
    get availableTransactions() {
      return u('/contracts/available-transactions')
    },
  },
  dashboard: {
    get stats() {
      return u('/dashboard/stats')
    },
  },
  categories: {
    get create() {
      return u('/categories')
    },
    get getAll() {
      return u('/categories')
    },
    getOne: (id: string) => u(`/categories/${id}`),
    update: (id: string) => u(`/categories/${id}`),
    delete: (id: string) => u(`/categories/${id}`),
  },
  suppliers: {
    get create() {
      return u('/suppliers')
    },
    get getAll() {
      return u('/suppliers')
    },
    getOne: (id: string) => u(`/suppliers/${id}`),
    update: (id: string) => u(`/suppliers/${id}`),
    delete: (id: string) => u(`/suppliers/${id}`),
  },
  products: {
    get create() {
      return u('/products')
    },
    get getAll() {
      return u('/products')
    },
    getOne: (id: string) => u(`/products/${id}`),
    update: (id: string) => u(`/products/${id}`),
    delete: (id: string) => u(`/products/${id}`),
    adjustStock: (id: string) => u(`/products/${id}/stock`),
    addMovement: (id: string) => u(`/products/${id}/movements`),
    get movements() {
      return u('/products/movements')
    },
  },
  reports: {
    get generate() {
      return u('/reports/generate')
    },
    get history() {
      return u('/reports/history')
    },
    historyOne: (id: string) => u(`/reports/history/${id}`),
    get schedules() {
      return u('/reports/schedules')
    },
    scheduleOne: (id: string) => u(`/reports/schedules/${id}`),
  },
}
