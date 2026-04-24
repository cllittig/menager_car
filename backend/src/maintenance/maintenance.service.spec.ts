import { Test, TestingModule } from '@nestjs/testing';
import { TenantResolutionService } from '../core/application/tenant-resolution.service';
import { MaintenanceApplicationService } from './application/maintenance.application-service';
import { MaintenanceRepository } from './domain/repositories/maintenance.repository';

describe('MaintenanceService (escopo: Manutenção)', () => {
  let service: MaintenanceApplicationService;

  it('create define updatedAt na manutenção e atualiza veículo', async () => {
    const insertMaintenance = jest.fn().mockResolvedValue(undefined);
    const updateVehicle = jest.fn().mockResolvedValue(undefined);
    const fullFetch = {
      id: 'm1',
      vehicleId: 'v1',
      description: 'Revisão',
      cost: 500,
      mechanic: 'Oficina X',
      vehicle: { brand: 'VW', model: 'Gol' },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaintenanceApplicationService,
        {
          provide: MaintenanceRepository,
          useValue: {
            listVehicleIdsByTenant: jest.fn(),
            findVehicleInTenant: jest.fn().mockResolvedValue({ status: 'AVAILABLE' }),
            insertMaintenance,
            updateVehicle,
            fetchMaintenanceCreated: jest.fn().mockResolvedValue(fullFetch),
            listMaintenancesForVehicleIds: jest.fn(),
            vehicleExistsInTenant: jest.fn(),
            listByVehicleId: jest.fn(),
            findOneWithVehicle: jest.fn(),
            updateFields: jest.fn(),
            updateStatusWithVehicle: jest.fn(),
            getVehicleStatus: jest.fn(),
            setVehicleStatus: jest.fn(),
            deleteServiceOrdersForMaintenance: jest.fn(),
            deleteMaintenanceById: jest.fn(),
            countPendingOrInProgressForVehicle: jest.fn(),
            listCostRowsForVehicleIds: jest.fn(),
          },
        },
        {
          provide: TenantResolutionService,
          useValue: { getTenantIdByUserIdOrThrow: jest.fn().mockResolvedValue('ten-1') },
        },
      ],
    }).compile();

    service = module.get(MaintenanceApplicationService);
    await service.create(
      {
        vehicleId: 'v1',
        description: 'Revisão',
        cost: 500,
        startDate: '2026-04-01',
        mechanic: 'Oficina X',
      } as never,
      'user-1',
    );

    const call = insertMaintenance.mock.calls[0] as [Record<string, unknown>] | undefined;
    expect(call).toBeDefined();
    const ins = call![0];
    expect(typeof ins['updatedAt']).toBe('string');
    expect(ins['createdBy']).toBe('user-1');
    expect(updateVehicle).toHaveBeenCalledWith(
      'v1',
      expect.objectContaining({ status: 'MAINTENANCE' }),
    );
  });
});
