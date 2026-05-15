import { useQuery } from "@tanstack/react-query"
import type { Maintenance } from "../domain/maintenance.types"
import { MaintenanceApplicationService } from "./maintenance.application-service"

const maintenanceApplication = new MaintenanceApplicationService()

export const maintenanceKeys = {
  all: ["maintenance"] as const,
  lists: () => [...maintenanceKeys.all, "list"] as const,
}

export function useMaintenanceList() {
  return useQuery<Maintenance[]>({
    queryKey: maintenanceKeys.lists(),
    queryFn: () => maintenanceApplication.getAll(),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: [],
  })
}
