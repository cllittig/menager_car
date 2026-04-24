import { useToast } from '@/components/ui/use-toast';
import { announceToScreenReader } from '@/lib/accessibility';
import type { Vehicle } from '../domain/vehicle.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { VehiclesApplicationService } from './vehicles.application-service';

const vehiclesApplication = new VehiclesApplicationService();

export const vehicleKeys = {
  all: ['vehicles'] as const,
  lists: () => [...vehicleKeys.all, 'list'] as const,
  details: () => [...vehicleKeys.all, 'detail'] as const,
  detail: (id: string) => [...vehicleKeys.details(), id] as const,
  stats: () => [...vehicleKeys.all, 'stats'] as const,
};

/**
 * Lista completa de veículos (servidor não recebe filtros neste contrato).
 * Query key estável: `vehicleKeys.lists()` — alinhada a invalidações e prefetch.
 */
export function useVehicles() {
  return useQuery<Vehicle[]>({
    queryKey: vehicleKeys.lists(),
    queryFn: () => vehiclesApplication.getAll(),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: [],
  });
}

export function useVehicle(id: string, enabled = true) {
  return useQuery<Vehicle>({
    queryKey: vehicleKeys.detail(id),
    queryFn: () => vehiclesApplication.getOne(id),
    enabled: enabled && !!id,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      vehiclesApplication.create(data as Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>),
    onSuccess: (newVehicle, variables) => {
      queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: vehicleKeys.stats() });
      queryClient.setQueryData(vehicleKeys.detail(newVehicle.id), newVehicle);
      toast({
        title: 'Veículo criado',
        description: `${variables.brand} ${variables.model} foi adicionado ao estoque.`,
      });
      announceToScreenReader(
        `Veículo ${variables.brand} ${variables.model} criado com sucesso`,
      );
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      const message = error.response?.data?.message || 'Erro ao criar veículo';
      toast({
        title: 'Erro ao criar veículo',
        description: message,
        variant: 'destructive',
      });
      announceToScreenReader(`Erro: ${message}`, 'assertive');
    },
  });
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Vehicle> }) =>
      vehiclesApplication.update(id, data),
    onSuccess: (updatedVehicle, { data }) => {
      queryClient.setQueryData(vehicleKeys.detail(updatedVehicle.id), updatedVehicle);
      queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: vehicleKeys.stats() });
      toast({
        title: 'Veículo atualizado',
        description: `${data.brand || updatedVehicle.brand} ${data.model || updatedVehicle.model} foi atualizado.`,
      });
      announceToScreenReader(
        `Veículo ${updatedVehicle.brand} ${updatedVehicle.model} atualizado com sucesso`,
      );
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      const message = error.response?.data?.message || 'Erro ao atualizar veículo';
      toast({
        title: 'Erro ao atualizar',
        description: message,
        variant: 'destructive',
      });
      announceToScreenReader(`Erro: ${message}`, 'assertive');
    },
  });
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => vehiclesApplication.delete(id),
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: vehicleKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: vehicleKeys.stats() });
      toast({
        title: 'Veículo excluído',
        description: 'Veículo foi removido do estoque.',
      });
      announceToScreenReader('Veículo excluído com sucesso');
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      const message = error.response?.data?.message || 'Erro ao excluir veículo';
      toast({
        title: 'Erro ao excluir',
        description: message,
        variant: 'destructive',
      });
      announceToScreenReader(`Erro: ${message}`, 'assertive');
    },
  });
}
