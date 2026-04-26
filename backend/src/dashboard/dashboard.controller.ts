import {
    Controller,
    Get,
    HttpStatus,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { CurrentUserId } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { OPERATIONAL_ROLES } from '../auth/roles.constants';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Roles(...OPERATIONAL_ROLES)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ 
    summary: 'Estatísticas gerais do dashboard do usuário',
    description: 'Retorna todas as estatísticas consolidadas do sistema veicular para o usuário autenticado'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Estatísticas do dashboard retornadas com sucesso',
    schema: {
      example: {
        totalVehicles: 45,
        availableVehicles: 28,
        soldVehicles: 15,
        maintenanceVehicles: 2,
        totalClients: 32,
        monthlySales: 8,
        totalRevenue: 450000,
        maintenanceCosts: 12500,
        activeContracts: 12,
        monthlyRevenue: 120000,
        monthlyExpenses: 95000,
        monthlyProfit: 25000,
        vehiclesPurchasedThisMonth: 3,
        vehiclesSoldThisMonth: 8,
        averageSalePrice: 15000,
        averagePurchasePrice: 11875,
        profitMargin: 20.8
      }
    }
  })
  getStats(@CurrentUserId() userId: string) {
    return this.dashboardService.getStats(userId);
  }
} 