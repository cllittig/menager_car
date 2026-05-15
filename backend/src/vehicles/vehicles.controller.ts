import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    ValidationPipe
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { VehicleStatus } from '../database/domain.enums';
import { VehicleRow } from '../database/vehicle.types';
import { CurrentUserId } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { OPERATIONAL_ROLES } from '../auth/roles.constants';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { IVehicleStats, VehicleWithRelations } from './interfaces/vehicle.interface';
import { VehiclesService } from './vehicles.service';






@ApiTags('vehicles')
@ApiBearerAuth()
@Roles(...OPERATIONAL_ROLES)
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}






















  @Post()
  @ApiOperation({ summary: 'Criar um novo veículo' })
  @ApiResponse({ status: 201, description: 'Veículo criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  create(
    @Body(new ValidationPipe({ transform: true })) createVehicleDto: CreateVehicleDto,
    @CurrentUserId() userId: string
  ): Promise<VehicleRow> {
    return this.vehiclesService.create({ ...createVehicleDto, userId });
  }












  @Get()
  @ApiOperation({ summary: 'Listar todos os veículos do usuário' })
  @ApiResponse({ status: 200, description: 'Lista de veículos retornada com sucesso' })
  findAll(
    @CurrentUserId() userId: string,
    @Query('skip', new ParseIntPipe({ optional: true })) skip?: number,
    @Query('take', new ParseIntPipe({ optional: true })) take?: number,
    @Query('status') status?: VehicleStatus,
    @Query('search') search?: string,
  ): Promise<VehicleRow[]> {
    return this.vehiclesService.findAll({ userId, skip, take, status, search });
  }
















  @Get('stats')
  @ApiOperation({ summary: 'Obter estatísticas dos veículos do usuário' })
  @ApiResponse({ status: 200, description: 'Estatísticas retornadas com sucesso' })
  getStats(@CurrentUserId() userId: string): Promise<IVehicleStats> {
    return this.vehiclesService.getVehicleStats(userId);
  }










  @Get(':id')
  @ApiOperation({ summary: 'Obter um veículo específico do usuário' })
  @ApiResponse({ status: 200, description: 'Veículo encontrado com sucesso' })
  @ApiResponse({ status: 404, description: 'Veículo não encontrado' })
  findOne(
    @Param('id') id: string, 
    @CurrentUserId() userId: string
  ): Promise<VehicleWithRelations> {
    return this.vehiclesService.findOne(id, userId);
  }
















  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar um veículo do usuário' })
  @ApiResponse({ status: 200, description: 'Veículo atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Veículo não encontrado' })
  update(
    @Param('id') id: string,
    @Body(new ValidationPipe({ transform: true })) updateVehicleDto: UpdateVehicleDto,
    @CurrentUserId() userId: string,
  ): Promise<VehicleRow> {
    return this.vehiclesService.update(id, userId, updateVehicleDto);
  }










  @Delete(':id')
  @ApiOperation({ summary: 'Remover um veículo do usuário (soft delete)' })
  @ApiResponse({ status: 200, description: 'Veículo removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Veículo não encontrado' })
  remove(
    @Param('id') id: string, 
    @CurrentUserId() userId: string
  ): Promise<VehicleRow> {
    return this.vehiclesService.remove(id, userId);
  }
} 