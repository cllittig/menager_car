import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DiskHealthIndicator, HealthCheck, HealthCheckService, MemoryHealthIndicator } from '@nestjs/terminus';
import { Public } from '../../auth/public.decorator';
import { MonitoringInterceptor } from '../../common/interceptors/monitoring.interceptor';
import { SupabaseService } from '../../supabase/supabase.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
    constructor(
        private health: HealthCheckService,
        private disk: DiskHealthIndicator,
        private memory: MemoryHealthIndicator,
        private readonly supabase: SupabaseService,
    ) {}

    @Public()
    @Get()
    @HealthCheck()
    @ApiOperation({ summary: 'Verificar saúde do sistema' })
    @ApiResponse({ status: 200, description: 'Status de saúde do sistema' })
    check() {
        // Determinar path correto baseado no sistema operacional
        const diskPath = process.platform === 'win32' ? 'C:\\' : '/';
        
        return this.health.check([
            // Verificar espaço em disco
            () => this.disk.checkStorage('storage', { path: diskPath, thresholdPercent: 0.9 }),
            
            // Verificar uso de memória
            () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
            () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024),
        ]);
    }

    @Public()
    @Get('simple')
    @ApiOperation({ summary: 'Health check simples' })
    @ApiResponse({ status: 200, description: 'Status básico do serviço' })
    simpleCheck() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
        };
    }

    @Public()
    @Get('detailed')
    @ApiOperation({ summary: 'Health check detalhado' })
    @ApiResponse({ status: 200, description: 'Status detalhado do sistema' })
    async detailedCheck() {
        const startTime = Date.now();
        
        // Teste de conexão com o banco
        let databaseStatus = 'ok';
        let dbResponseTime = 0;
        try {
            const dbStart = Date.now();
            const { error } = await this.supabase.getClient().from('User').select('id').limit(1);
            if (error) {
              throw error;
            }
            dbResponseTime = Date.now() - dbStart;
        } catch {
            databaseStatus = 'error';
        }

        const totalTime = Date.now() - startTime;

        return {
            status: databaseStatus === 'ok' ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            services: {
                database: {
                    status: databaseStatus,
                    responseTime: `${dbResponseTime}ms`,
                },
            },
            metrics: MonitoringInterceptor.getMetrics(),
            system: {
                platform: process.platform,
                nodeVersion: process.version,
                memory: process.memoryUsage(),
                cpu: process.cpuUsage(),
            },
            responseTime: `${totalTime}ms`,
        };
    }

    @Public()
    @Get('metrics')
    @ApiOperation({ summary: 'Métricas do sistema' })
    @ApiResponse({ status: 200, description: 'Métricas de performance' })
    getMetrics() {
        return {
            ...MonitoringInterceptor.getMetrics(),
            system: {
                platform: process.platform,
                nodeVersion: process.version,
                memory: process.memoryUsage(),
                uptime: process.uptime(),
            },
        };
    }

    @Get('metrics/reset')
    @ApiOperation({ summary: 'Reset das métricas (apenas Admin)' })
    @ApiResponse({ status: 200, description: 'Métricas resetadas' })
    resetMetrics() {
        MonitoringInterceptor.resetMetrics();
        return {
            message: 'Métricas resetadas com sucesso',
            timestamp: new Date().toISOString(),
        };
    }
} 