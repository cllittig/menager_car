export type { Vehicle } from './domain/vehicle.types';
export { VehicleRepository } from './domain/repositories/vehicle.repository';
export { HttpVehicleRepository } from './infrastructure/http-vehicle.repository';
export { VehiclesApplicationService } from './application/vehicles.application-service';
export {
  vehicleKeys,
  useVehicle,
  useVehicles,
  useCreateVehicle,
  useUpdateVehicle,
  useDeleteVehicle,
} from './application/use-vehicles';
