import { Test, TestingModule } from '@nestjs/testing';
import { TenantResolutionService } from '../core/application/tenant-resolution.service';
import { DashboardApplicationService } from '../dashboard/application/dashboard.application-service';
import { ReportsApplicationService } from './application/reports.application-service';
import { ReportRepository } from './domain/repositories/report.repository';

describe('ReportsService (escopo: Relatórios)', () => {
  let service: ReportsApplicationService;

  it('generate persiste snapshot com payload do dashboard', async () => {
    const dashboard = { getStats: jest.fn().mockResolvedValue({ totalVehicles: 3 }) };

    const insertSnapshot = jest.fn().mockResolvedValue({
      id: 'snap-1',
      title: 'R1',
      payload: { totalVehicles: 3 },
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsApplicationService,
        {
          provide: ReportRepository,
          useValue: {
            insertSnapshot,
            listSnapshotHistory: jest.fn(),
            getSnapshotById: jest.fn(),
            listSchedules: jest.fn(),
            insertSchedule: jest.fn(),
            findScheduleId: jest.fn(),
            updateSchedule: jest.fn(),
            deleteSchedule: jest.fn(),
          },
        },
        { provide: DashboardApplicationService, useValue: dashboard },
        {
          provide: TenantResolutionService,
          useValue: { getTenantIdByUserIdOrThrow: jest.fn().mockResolvedValue('ten-1') },
        },
      ],
    }).compile();

    service = module.get(ReportsApplicationService);
    const out = (await service.generate({ reportType: 'DASHBOARD', title: 'R1' }, 'user-1')) as {
      payload: unknown;
    };
    expect(out.payload).toEqual({ totalVehicles: 3 });
    expect(dashboard.getStats).toHaveBeenCalledWith('user-1');
  });
});
