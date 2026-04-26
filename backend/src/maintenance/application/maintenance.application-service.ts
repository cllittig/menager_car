import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { TenantResolutionService } from '../../core/application/tenant-resolution.service';
import { MaintenanceStatus } from '../../database/domain.enums';
import { MaintenanceRepository } from '../domain/repositories/maintenance.repository';
import { CreateMaintenanceDto } from '../dto/create-maintenance.dto';

@Injectable()
export class MaintenanceApplicationService {
  constructor(
    private readonly tenantResolution: TenantResolutionService,
    private readonly maintenanceRepository: MaintenanceRepository,
  ) {}

  async create(createMaintenanceDto: CreateMaintenanceDto, userId: string) {
    const tenantId = await this.tenantResolution.getTenantIdByUserIdOrThrow(userId);
    const vehicle = await this.maintenanceRepository.findVehicleInTenant(
      createMaintenanceDto.vehicleId,
      tenantId,
    );

    if (!vehicle) {
      throw new NotFoundException('Veículo não encontrado ou não pertence ao usuário');
    }

    const maintId = randomUUID();
    const now = new Date().toISOString();
    await this.maintenanceRepository.insertMaintenance({
      id: maintId,
      vehicleId: createMaintenanceDto.vehicleId,
      description: createMaintenanceDto.description,
      cost: createMaintenanceDto.cost,
      startDate: new Date(createMaintenanceDto.startDate).toISOString(),
      endDate: createMaintenanceDto.endDate
        ? new Date(createMaintenanceDto.endDate).toISOString()
        : null,
      status: createMaintenanceDto.status ?? MaintenanceStatus.PENDING,
      mechanic: createMaintenanceDto.mechanic,
      createdBy: userId,
      updatedAt: now,
    });

    if (vehicle.status !== 'SOLD') {
      await this.maintenanceRepository.updateVehicle(createMaintenanceDto.vehicleId, {
        status: 'MAINTENANCE',
        updatedAt: new Date().toISOString(),
      });
    }

    return this.maintenanceRepository.fetchMaintenanceCreated(maintId);
  }

  async findAll(userId: string) {
    const tenantId = await this.tenantResolution.getTenantIdByUserIdOrThrow(userId);
    const vids = await this.maintenanceRepository.listVehicleIdsByTenant(tenantId);
    if (vids.length === 0) {
      return [];
    }
    return this.maintenanceRepository.listMaintenancesForVehicleIds(vids);
  }

  async findByVehicle(vehicleId: string, userId: string) {
    const tenantId = await this.tenantResolution.getTenantIdByUserIdOrThrow(userId);
    const exists = await this.maintenanceRepository.vehicleExistsInTenant(vehicleId, tenantId);
    if (!exists) {
      return [];
    }
    return this.maintenanceRepository.listByVehicleId(vehicleId);
  }

  async findOne(id: string, userId: string) {
    const tenantId = await this.tenantResolution.getTenantIdByUserIdOrThrow(userId);
    const vids = await this.maintenanceRepository.listVehicleIdsByTenant(tenantId);
    const row = await this.maintenanceRepository.findOneWithVehicle(id);
    if (!row) {
      throw new NotFoundException('Manutenção não encontrada ou não pertence ao usuário');
    }
    if (!vids.includes(row.vehicleId as string)) {
      throw new NotFoundException('Manutenção não encontrada ou não pertence ao usuário');
    }
    return row;
  }

  async updateStatus(
    id: string,
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED',
    userId: string,
  ) {
    const maintenance = (await this.findOne(id, userId)) as unknown as {
      vehicleId: string;
      endDate: string | null;
    };

    const endDate =
      status === 'COMPLETED' ? new Date().toISOString() : maintenance.endDate;

    const result = await this.maintenanceRepository.updateStatusWithVehicle(
      id,
      status,
      endDate,
    );

    if (status === 'COMPLETED') {
      const veh = await this.maintenanceRepository.getVehicleStatus(maintenance.vehicleId);
      if (veh?.status === 'MAINTENANCE') {
        await this.maintenanceRepository.setVehicleStatus(maintenance.vehicleId, 'AVAILABLE');
      }
    }

    return result;
  }

  async update(id: string, updateData: Partial<CreateMaintenanceDto>, userId: string) {
    await this.findOne(id, userId);

    const patch: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (updateData.vehicleId) {
      patch.vehicleId = updateData.vehicleId;
    }
    if (updateData.description) {
      patch.description = updateData.description;
    }
    if (updateData.cost !== undefined) {
      patch.cost = updateData.cost;
    }
    if (updateData.status) {
      patch.status = updateData.status;
    }
    if (updateData.mechanic) {
      patch.mechanic = updateData.mechanic;
    }
    if (updateData.startDate) {
      patch.startDate = new Date(updateData.startDate).toISOString();
    }
    if (updateData.endDate) {
      patch.endDate = new Date(updateData.endDate).toISOString();
    }

    return this.maintenanceRepository.updateFields(id, patch);
  }

  async delete(id: string, userId: string) {
    const maintenance = (await this.findOne(id, userId)) as unknown as { vehicleId: string };

    await this.maintenanceRepository.deleteServiceOrdersForMaintenance(id);
    await this.maintenanceRepository.deleteMaintenanceById(id);

    const pendingMaintenances =
      await this.maintenanceRepository.countPendingOrInProgressForVehicle(maintenance.vehicleId);

    if (pendingMaintenances === 0) {
      const veh = await this.maintenanceRepository.getVehicleStatus(maintenance.vehicleId);
      if (veh?.status === 'MAINTENANCE') {
        await this.maintenanceRepository.setVehicleStatus(maintenance.vehicleId, 'AVAILABLE');
      }
    }

    return { message: 'Manutenção excluída com sucesso' };
  }

  async getMaintenanceStats(userId: string) {
    const tenantId = await this.tenantResolution.getTenantIdByUserIdOrThrow(userId);
    const vids = await this.maintenanceRepository.listVehicleIdsByTenant(tenantId);
    if (vids.length === 0) {
      return {
        totalMaintenances: 0,
        maintenancesByStatus: [],
        monthlyExpenses: 0,
        totalExpenses: 0,
      };
    }

    const rows = await this.maintenanceRepository.listCostRowsForVehicleIds(vids);

    const totalMaintenances = rows.length;
    const startMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const byStatus = new Map<string, { _count: { id: number }; _sum: { cost: number } }>();
    for (const r of rows) {
      const cur = byStatus.get(r.status) ?? { _count: { id: 0 }, _sum: { cost: 0 } };
      cur._count.id += 1;
      cur._sum.cost += r.cost;
      byStatus.set(r.status, cur);
    }
    const maintenancesByStatus = [...byStatus.entries()].map(([status, v]) => ({
      status,
      _count: v._count,
      _sum: v._sum,
    }));

    const monthlyExpenses = rows
      .filter((r) => new Date(r.createdAt) >= startMonth)
      .reduce((s, r) => s + r.cost, 0);
    const totalExpenses = rows.reduce((s, r) => s + r.cost, 0);

    return {
      totalMaintenances,
      maintenancesByStatus,
      monthlyExpenses,
      totalExpenses,
    };
  }
}
