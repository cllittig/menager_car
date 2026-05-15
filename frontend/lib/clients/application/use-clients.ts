import { useToast } from '@/components/ui/use-toast';
import { announceToScreenReader } from '@/lib/accessibility';
import type { Client } from '../domain/client.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClientsApplicationService } from './clients.application-service';

const clientsApplication = new ClientsApplicationService();

export const clientKeys = {
  all: ['clients'] as const,
  lists: () => [...clientKeys.all, 'list'] as const,
  details: () => [...clientKeys.all, 'detail'] as const,
  detail: (id: string) => [...clientKeys.details(), id] as const,
  stats: () => [...clientKeys.all, 'stats'] as const,
};

export function useClients() {
  return useQuery<Client[]>({
    queryKey: clientKeys.lists(),
    queryFn: () => clientsApplication.getAll(),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useClient(id: string, enabled = true) {
  return useQuery<Client>({
    queryKey: clientKeys.detail(id),
    queryFn: () => clientsApplication.getOne(id),
    enabled: enabled && !!id,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) =>
      clientsApplication.create(data),
    onSuccess: (created, variables) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      queryClient.invalidateQueries({ queryKey: clientKeys.stats() });
      queryClient.setQueryData(clientKeys.detail(created.id), created);
      toast({
        title: 'Cliente adicionado',
        description: `${variables.name} foi adicionado ao sistema.`,
      });
      announceToScreenReader(`Cliente ${variables.name} criado com sucesso`);
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      const message = error.response?.data?.message || 'Erro ao criar cliente';
      toast({
        title: 'Erro ao salvar',
        description: message,
        variant: 'destructive',
      });
      announceToScreenReader(`Erro: ${message}`, 'assertive');
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Client> }) =>
      clientsApplication.update(id, data),
    onSuccess: (updated, { data }) => {
      queryClient.setQueryData(clientKeys.detail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      queryClient.invalidateQueries({ queryKey: clientKeys.stats() });
      toast({
        title: 'Cliente atualizado',
        description: `${data.name || updated.name} foi atualizado com sucesso.`,
      });
      announceToScreenReader(
        `Cliente ${updated.name} atualizado com sucesso`,
      );
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      const message = error.response?.data?.message || 'Erro ao atualizar cliente';
      toast({
        title: 'Erro ao salvar',
        description: message,
        variant: 'destructive',
      });
      announceToScreenReader(`Erro: ${message}`, 'assertive');
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => clientsApplication.delete(id),
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: clientKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      queryClient.invalidateQueries({ queryKey: clientKeys.stats() });
      toast({
        title: 'Cliente excluído',
        description: 'Cliente foi removido do sistema.',
      });
      announceToScreenReader('Cliente excluído com sucesso');
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      const message = error.response?.data?.message || 'Erro ao excluir cliente';
      toast({
        title: 'Erro ao excluir',
        description: message,
        variant: 'destructive',
      });
      announceToScreenReader(`Erro: ${message}`, 'assertive');
    },
  });
}
