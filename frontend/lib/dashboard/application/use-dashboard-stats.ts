import { useQuery } from "@tanstack/react-query"
import type { DashboardStats } from "../domain/dashboard.types"
import { DashboardApplicationService } from "./dashboard.application-service"

const dashboardApplication = new DashboardApplicationService()

export const dashboardKeys = {
  all: ["dashboard"] as const,
  stats: () => [...dashboardKeys.all, "stats"] as const,
}

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: dashboardKeys.stats(),
    queryFn: () => dashboardApplication.getStats(),
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}
