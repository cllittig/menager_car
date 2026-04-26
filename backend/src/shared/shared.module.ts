import { Global, Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { TenantResolutionService } from '../core/application/tenant-resolution.service';
import { HealthController } from './health/health.controller';
import { AuditService } from './services/audit.service';
import { CacheService } from './services/cache.service';
import { LoggerService } from './services/logger.service';
import { NotificationService } from './services/notification.service';

@Global()
@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [
    LoggerService,
    AuditService,
    CacheService,
    NotificationService,
    TenantResolutionService,
  ],
  exports: [
    LoggerService,
    AuditService,
    CacheService,
    NotificationService,
    TenantResolutionService,
  ],
})
export class SharedModule {} 