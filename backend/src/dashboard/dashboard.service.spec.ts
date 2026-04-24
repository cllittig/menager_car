import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TenantResolutionService } from '../core/application/tenant-resolution.service';
import { DashboardApplicationService } from './application/dashboard.application-service';
import { DashboardRepository } from './domain/repositories/dashboard.repository';

describe('DashboardService (escopo: Dashboard)', () => {
  it('getStats retorna métricas zeradas quando tenant não resolve (fallback do serviço)', async () => {
    const err = jest.spyOn(console, 'error').mockImplementation(() => {});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardApplicationService,
        {
          provide: DashboardRepository,
          useValue: {
            listVehicleIdsByTenant: jest.fn(),
            countVehicles: jest.fn(),
            countActiveClients: jest.fn(),
            listTransactionsForVehicles: jest.fn(),
            sumCompletedMaintenanceCosts: jest.fn(),
            listContractTransactionIds: jest.fn(),
            countTransactionsMatching: jest.fn(),
            listVehiclesBriefByTenant: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: TenantResolutionService,
          useValue: {
            getTenantIdByUserIdOrThrow: jest
              .fn()
              .mockRejectedValue(new NotFoundException('Tenant do usuário não encontrado')),
          },
        },
      ],
    }).compile();

    const service = module.get(DashboardApplicationService);
    try {
      const stats = await service.getStats('user-x');
      expect(stats.totalVehicles).toBe(0);
      expect(stats.totalClients).toBe(0);
      expect(stats.monthlySales).toBe(0);
    } finally {
      err.mockRestore();
    }
  });
});
