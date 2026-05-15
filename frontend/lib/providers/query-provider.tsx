'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { type ReactNode } from 'react'
import { ClientsApplicationService } from '@/lib/clients/application/clients.application-service'
import { clientKeys } from '@/lib/clients/application/use-clients'
import { dashboardKeys } from '@/lib/dashboard'
import { getHttpStatusFromUnknown } from '@/lib/http/error-guards'
import { maintenanceKeys } from '@/lib/maintenance'
import { VehiclesApplicationService } from '@/lib/vehicles/application/vehicles.application-service'
import { vehicleKeys } from '@/lib/vehicles/application/use-vehicles'

const vehiclesApplicationForPrefetch = new VehiclesApplicationService()
const clientsApplicationForPrefetch = new ClientsApplicationService()


function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {

        staleTime: 2 * 60 * 1000, 

        gcTime: 10 * 60 * 1000, 

        retry: (failureCount, error: unknown) => {
          const status = getHttpStatusFromUnknown(error)
          if (status !== undefined && status >= 400 && status < 500) {
            return false
          }
          return failureCount < 3
        },

        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),


        refetchOnWindowFocus: false,

        refetchOnReconnect: true,

        refetchOnMount: true,
      },
      mutations: {

        retry: 1,

        mutationFn: undefined,
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined = undefined

function getQueryClient() {
  if (typeof window === 'undefined') {

    return makeQueryClient()
  } else {

    if (!browserQueryClient) browserQueryClient = makeQueryClient()
    return browserQueryClient
  }
}

interface QueryProviderProps {
  children: ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {

  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition="bottom-left"
          position="bottom"
        />
      )}
    </QueryClientProvider>
  )
}


export function useInvalidateQueries() {
  const queryClient = getQueryClient()

  return {

    invalidateVehicles: () =>
      queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() }),

    invalidateVehicle: (id: string) =>
      queryClient.invalidateQueries({ queryKey: vehicleKeys.detail(id) }),

    invalidateClients: () =>
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() }),

    invalidateDashboard: () =>
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all }),
    invalidateMaintenance: () =>
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.lists() }),

    invalidateAll: () => queryClient.invalidateQueries(),
  }
}


export function usePrefetchData() {
  const queryClient = getQueryClient()

  return {

    prefetchVehicles: () => {
      queryClient.prefetchQuery({
        queryKey: vehicleKeys.lists(),
        queryFn: () => vehiclesApplicationForPrefetch.getAll(),
        staleTime: 30 * 1000,
        gcTime: 5 * 60 * 1000,
      })
    },

    prefetchVehicle: (id: string) => {
      queryClient.prefetchQuery({
        queryKey: vehicleKeys.detail(id),
        queryFn: () => vehiclesApplicationForPrefetch.getOne(id),
        staleTime: 2 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
      })
    },
    prefetchClients: () => {
      queryClient.prefetchQuery({
        queryKey: clientKeys.lists(),
        queryFn: () => clientsApplicationForPrefetch.getAll(),
        staleTime: 30 * 1000,
        gcTime: 5 * 60 * 1000,
      })
    },
  }
} 