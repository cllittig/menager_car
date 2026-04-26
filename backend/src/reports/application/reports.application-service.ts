import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { TenantResolutionService } from '../../core/application/tenant-resolution.service';
import { DashboardApplicationService } from '../../dashboard/application/dashboard.application-service';
import { ReportRepository } from '../domain/repositories/report.repository';
import { CreateReportScheduleDto } from '../dto/create-report-schedule.dto';
import { GenerateReportDto } from '../dto/generate-report.dto';
import { UpdateReportScheduleDto } from '../dto/update-report-schedule.dto';

@Injectable()
export class ReportsApplicationService {
  constructor(
    private readonly reportRepository: ReportRepository,
    private readonly dashboardApplicationService: DashboardApplicationService,
    private readonly tenantResolution: TenantResolutionService,
  ) {}

  async generate(dto: GenerateReportDto, userId: string) {
    const tenantId = await this.tenantResolution.getTenantIdByUserIdOrThrow(userId);
    let payload: Record<string, unknown>;
    const type = dto.reportType.toUpperCase();
    if (type === 'DASHBOARD') {
      payload = (await this.dashboardApplicationService.getStats(userId)) as unknown as Record<
        string,
        unknown
      >;
    } else {
      payload = { message: 'Tipo de relatório genérico', reportType: dto.reportType };
    }

    const title = dto.title?.trim() || `Relatório ${dto.reportType} — ${new Date().toISOString()}`;
    const now = new Date().toISOString();
    return this.reportRepository.insertSnapshot({
      id: randomUUID(),
      tenantId,
      generatedBy: userId,
      reportType: dto.reportType,
      title,
      payload,
      createdAt: now,
    });
  }

  async history(userId: string) {
    const tenantId = await this.tenantResolution.getTenantIdByUserIdOrThrow(userId);
    return this.reportRepository.listSnapshotHistory(tenantId);
  }

  async getSnapshot(id: string, userId: string) {
    const tenantId = await this.tenantResolution.getTenantIdByUserIdOrThrow(userId);
    const row = await this.reportRepository.getSnapshotById(id, tenantId);
    if (!row) {
      throw new NotFoundException('Relatório não encontrado');
    }
    return row;
  }

  async listSchedules(userId: string) {
    const tenantId = await this.tenantResolution.getTenantIdByUserIdOrThrow(userId);
    return this.reportRepository.listSchedules(tenantId);
  }

  async createSchedule(dto: CreateReportScheduleDto, userId: string) {
    const tenantId = await this.tenantResolution.getTenantIdByUserIdOrThrow(userId);
    const now = new Date().toISOString();
    return this.reportRepository.insertSchedule({
      id: randomUUID(),
      tenantId,
      createdBy: userId,
      reportType: dto.reportType,
      cronExpression: dto.cronExpression,
      emailTo: dto.emailTo,
      isActive: dto.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    });
  }

  async updateSchedule(id: string, dto: UpdateReportScheduleDto, userId: string) {
    const tenantId = await this.tenantResolution.getTenantIdByUserIdOrThrow(userId);
    const existing = await this.reportRepository.findScheduleId(id, tenantId);
    if (!existing) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    const payload: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (dto.reportType !== undefined) {
      payload.reportType = dto.reportType;
    }
    if (dto.cronExpression !== undefined) {
      payload.cronExpression = dto.cronExpression;
    }
    if (dto.emailTo !== undefined) {
      payload.emailTo = dto.emailTo;
    }
    if (dto.isActive !== undefined) {
      payload.isActive = dto.isActive;
    }

    return this.reportRepository.updateSchedule(id, tenantId, payload);
  }

  async removeSchedule(id: string, userId: string) {
    const tenantId = await this.tenantResolution.getTenantIdByUserIdOrThrow(userId);
    return this.reportRepository.deleteSchedule(id, tenantId);
  }
}
