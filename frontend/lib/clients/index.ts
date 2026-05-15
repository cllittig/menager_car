export type { Client, ClientStats } from './domain/client.types';
export { ClientRepository } from './domain/repositories/client.repository';
export { HttpClientRepository } from './infrastructure/http-client.repository';
export { ClientsApplicationService } from './application/clients.application-service';
export {
  clientKeys,
  useClient,
  useClients,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
} from './application/use-clients';
