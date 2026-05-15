
export const config = {

  API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005',
  SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',


  API_TIMEOUT: 10000,


  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',


  endpoints: {
    auth: {
      login: '/auth/login',
      me: '/auth/me',
      logout: '/auth/logout'
    },
    users: '/usuario',
    vehicles: '/vehicles',
    clients: '/clients',
    sales: '/sales',
    maintenance: '/maintenance',
    contracts: '/contracts'
  }
} as const

export default config 