import {
    Body,
    Controller,
    Delete,
    Get,
    HttpStatus,
    Param,
    Patch,
    Post,
    UseGuards
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { CurrentUserId } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { OPERATIONAL_ROLES } from '../auth/roles.constants';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { MaintenanceService } from './maintenance.service';

@ApiTags('Manutenção')
@ApiBearerAuth()
@Roles(...OPERATIONAL_ROLES)
@UseGuards(JwtAuthGuard)
@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar nova manutenção' })
  @ApiBody({ type: CreateMaintenanceDto })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Manutenção registrada com sucesso' })
  create(@Body() createMaintenanceDto: CreateMaintenanceDto, @CurrentUserId() userId: string) {
    return this.maintenanceService.create(createMaintenanceDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as manutenções' })
  findAll(@CurrentUserId() userId: string) {
    return this.maintenanceService.findAll(userId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Estatísticas de manutenção' })
  getStats(@CurrentUserId() userId: string) {
    return this.maintenanceService.getMaintenanceStats(userId);
  }

  @Get('vehicle/:vehicleId')
  @ApiOperation({ summary: 'Buscar manutenções por veículo' })
  @ApiParam({ name: 'vehicleId', description: 'ID do veículo' })
  findByVehicle(@Param('vehicleId') vehicleId: string, @CurrentUserId() userId: string) {
    return this.maintenanceService.findByVehicle(vehicleId, userId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Atualizar status da manutenção' })
  @ApiParam({ name: 'id', description: 'ID da manutenção' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED',
    @CurrentUserId() userId: string,
  ) {
    return this.maintenanceService.updateStatus(id, status, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar manutenção' })
  @ApiParam({ name: 'id', description: 'ID da manutenção' })
  @ApiBody({ type: CreateMaintenanceDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Manutenção atualizada com sucesso' })
  update(
    @Param('id') id: string,
    @Body() updateMaintenanceDto: Partial<CreateMaintenanceDto>,
    @CurrentUserId() userId: string,
  ) {
    return this.maintenanceService.update(id, updateMaintenanceDto, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar manutenção por ID' })
  @ApiParam({ name: 'id', description: 'ID da manutenção' })
  findOne(@Param('id') id: string, @CurrentUserId() userId: string) {
    return this.maintenanceService.findOne(id, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir manutenção' })
  @ApiParam({ name: 'id', description: 'ID da manutenção' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Manutenção excluída com sucesso' })
  delete(@Param('id') id: string, @CurrentUserId() userId: string) {
    return this.maintenanceService.delete(id, userId);
  }
} 