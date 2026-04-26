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

/**
 * Controlador responsável por gerenciar as requisições HTTP relacionadas a veículos
 * @class VehiclesController
 * @description Implementa os endpoints REST para operações CRUD e consultas de veículos com isolamento por usuário
 */
@ApiTags('vehicles')
@ApiBearerAuth()
@Roles(...OPERATIONAL_ROLES)
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  /**
   * Cria um novo veículo para o usuário autenticado
   * @param {CreateVehicleDto} createVehicleDto - Dados do veículo a ser criado
   * @param {any} req - Requisição HTTP com dados do usuário autenticado
   * @returns {Promise<Vehicle>} Veículo criado
   * @throws {BadRequestException} Se os dados forem inválidos
   * @example
   * POST /vehicles
   * {
   *   "brand": "Toyota",
   *   "model": "Corolla",
   *   "year": 2023,
   *   "licensePlate": "ABC1234",
   *   "chassis": "123456789",
   *   "mileage": 0,
   *   "color": "Prata",
   *   "fuelType": "FLEX",
   *   "purchasePrice": 120000,
   *   "purchaseDate": "2024-03-20T00:00:00.000Z"
   * }
   */
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

  /**
   * Lista todos os veículos do usuário autenticado com paginação e filtros
   * @param {number} skip - Número de registros para pular
   * @param {number} take - Número de registros para retornar
   * @param {VehicleStatus} status - Status do veículo para filtrar
   * @param {string} search - Termo de busca
   * @param {any} req - Requisição HTTP com dados do usuário autenticado
   * @returns {Promise<Vehicle[]>} Lista de veículos do usuário
   * @example
   * GET /vehicles?skip=0&take=10&status=AVAILABLE&search=Toyota
   */
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

  /**
   * Obtém estatísticas dos veículos do usuário autenticado
   * @param {any} req - Requisição HTTP com dados do usuário autenticado
   * @returns {Promise<IVehicleStats>} Estatísticas dos veículos do usuário
   * @example
   * GET /vehicles/stats
   * // Response:
   * // {
   * //   "total": 100,
   * //   "available": 50,
   * //   "maintenance": 10,
   * //   "sold": 30,
   * //   "reserved": 10
   * // }
   */
  @Get('stats')
  @ApiOperation({ summary: 'Obter estatísticas dos veículos do usuário' })
  @ApiResponse({ status: 200, description: 'Estatísticas retornadas com sucesso' })
  getStats(@CurrentUserId() userId: string): Promise<IVehicleStats> {
    return this.vehiclesService.getVehicleStats(userId);
  }

  /**
   * Busca um veículo específico do usuário autenticado pelo ID
   * @param {string} id - ID do veículo
   * @param {any} req - Requisição HTTP com dados do usuário autenticado
   * @returns {Promise<VehicleWithRelations>} Veículo encontrado com suas relações
   * @throws {NotFoundException} Se o veículo não for encontrado ou não pertencer ao usuário
   * @example
   * GET /vehicles/123e4567-e89b-12d3-a456-426614174000
   */
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

  /**
   * Atualiza um veículo existente do usuário autenticado
   * @param {string} id - ID do veículo
   * @param {UpdateVehicleDto} updateVehicleDto - Dados a serem atualizados
   * @param {any} req - Requisição HTTP com dados do usuário autenticado
   * @returns {Promise<Vehicle>} Veículo atualizado
   * @throws {NotFoundException} Se o veículo não for encontrado ou não pertencer ao usuário
   * @example
   * PATCH /vehicles/123e4567-e89b-12d3-a456-426614174000
   * {
   *   "status": "SOLD",
   *   "salePrice": 130000,
   *   "saleDate": "2024-03-20T00:00:00.000Z"
   * }
   */
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

  /**
   * Remove um veículo do usuário autenticado do sistema (soft delete)
   * @param {string} id - ID do veículo
   * @param {any} req - Requisição HTTP com dados do usuário autenticado
   * @returns {Promise<Vehicle>} Veículo removido
   * @throws {NotFoundException} Se o veículo não for encontrado ou não pertencer ao usuário
   * @example
   * DELETE /vehicles/123e4567-e89b-12d3-a456-426614174000
   */
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