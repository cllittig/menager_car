import {
    Body,
    Controller,
    Delete,
    Get,
    HttpStatus,
    Param,
    Patch,
    Post
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiTags
} from '@nestjs/swagger';
import { CurrentUserId } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { OPERATIONAL_ROLES } from '../auth/roles.constants';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@ApiTags('Clientes')
@ApiBearerAuth()
@Roles(...OPERATIONAL_ROLES)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Criar novo cliente do usuário',
    description: 'Cria um novo cliente no sistema para o usuário autenticado'
  })
  @ApiBody({ type: CreateClientDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Cliente criado com sucesso',
    schema: {
      example: {
        id: 'uuid-example',
        name: 'João Silva Santos',
        email: 'joao.silva@email.com',
        phone: '(11) 99999-9999',
        cpf: '12345678901',
        cnh: '12345678901',
        address: 'Rua das Flores, 123 - Centro - São Paulo/SP',
        isActive: true,
        createdAt: '2025-06-19T14:30:00Z',
        updatedAt: '2025-06-19T14:30:00Z'
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'CPF ou e-mail já cadastrado',
    schema: {
      example: {
        statusCode: 409,
        message: 'CPF já cadastrado no sistema',
        error: 'Conflict'
      }
    }
  })
  create(
    @Body() createClientDto: CreateClientDto, 
    @CurrentUserId() userId: string
  ) {
    return this.clientsService.create(createClientDto, userId);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Listar todos os clientes do usuário',
    description: 'Retorna lista de todos os clientes do usuário autenticado com suas transações'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de clientes retornada com sucesso',
    schema: {
      example: [
        {
          id: 'uuid-example',
          name: 'João Silva Santos',
          email: 'joao.silva@email.com',
          phone: '(11) 99999-9999',
          cpf: '12345678901',
          cnh: '12345678901',
          address: 'Rua das Flores, 123 - Centro - São Paulo/SP',
          isActive: true,
          createdAt: '2025-06-19T14:30:00Z',
          updatedAt: '2025-06-19T14:30:00Z',
          transactions: [
            {
              id: 'transaction-uuid',
              amount: 50000,
              createdAt: '2025-06-19T15:00:00Z',
              vehicle: {
                brand: 'Toyota',
                model: 'Corolla',
                year: 2023,
                licensePlate: 'ABC-1234'
              }
            }
          ],
          _count: {
            transactions: 1
          }
        }
      ]
    }
  })
  findAll(@CurrentUserId() userId: string) {
    return this.clientsService.findAll(userId);
  }

  @Get('stats')
  @ApiOperation({ 
    summary: 'Estatísticas dos clientes do usuário',
    description: 'Retorna estatísticas dos clientes do usuário autenticado (total, novos este mês, top clientes)'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Estatísticas retornadas com sucesso',
    schema: {
      example: {
        totalClients: 150,
        clientsThisMonth: 12,
        topClients: [
          {
            id: 'uuid-example',
            name: 'João Silva Santos',
            email: 'joao.silva@email.com',
            totalPurchases: 150000,
            _count: {
              transactions: 3
            }
          }
        ]
      }
    }
  })
  getStats(@CurrentUserId() userId: string) {
    return this.clientsService.getClientStats(userId);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Buscar cliente do usuário por ID',
    description: 'Retorna um cliente específico do usuário autenticado com todas suas transações e contratos'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID único do cliente', 
    example: 'uuid-example' 
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cliente encontrado com sucesso',
    schema: {
      example: {
        id: 'uuid-example',
        name: 'João Silva Santos',
        email: 'joao.silva@email.com',
        phone: '(11) 99999-9999',
        cpf: '12345678901',
        cnh: '12345678901',
        address: 'Rua das Flores, 123 - Centro - São Paulo/SP',
        isActive: true,
        createdAt: '2025-06-19T14:30:00Z',
        updatedAt: '2025-06-19T14:30:00Z',
        transactions: [
          {
            id: 'transaction-uuid',
            amount: 50000,
            type: 'SALE',
            status: 'PAID',
            vehicle: {
              brand: 'Toyota',
              model: 'Corolla',
              year: 2023,
              licensePlate: 'ABC-1234'
            },
            contract: {
              id: 'contract-uuid',
              fileName: 'contrato_joao_silva.pdf'
            }
          }
        ]
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Cliente não encontrado',
    schema: {
      example: {
        statusCode: 404,
        message: 'Cliente não encontrado',
        error: 'Not Found'
      }
    }
  })
  findOne(
    @Param('id') id: string, 
    @CurrentUserId() userId: string
  ) {
    return this.clientsService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ 
    summary: 'Atualizar cliente do usuário',
    description: 'Atualiza dados de um cliente existente do usuário autenticado'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID único do cliente', 
    example: 'uuid-example' 
  })
  @ApiBody({ type: UpdateClientDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cliente atualizado com sucesso',
    schema: {
      example: {
        id: 'uuid-example',
        name: 'João Silva Santos',
        email: 'joao.silva@email.com',
        phone: '(11) 88888-8888',
        cpf: '12345678901',
        cnh: '12345678901',
        address: 'Rua das Rosas, 456 - Vila Nova - São Paulo/SP',
        isActive: true,
        createdAt: '2025-06-19T14:30:00Z',
        updatedAt: '2025-06-19T16:45:00Z'
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Cliente não encontrado'
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'CPF ou e-mail já cadastrado para outro cliente'
  })
  update(
    @Param('id') id: string, 
    @Body() updateClientDto: UpdateClientDto, 
    @CurrentUserId() userId: string
  ) {
    return this.clientsService.update(id, userId, updateClientDto);
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Excluir cliente do usuário',
    description: 'Remove um cliente do usuário autenticado do sistema (apenas se não tiver transações)'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID único do cliente', 
    example: 'uuid-example' 
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cliente excluído com sucesso',
    schema: {
      example: {
        id: 'uuid-example',
        name: 'João Silva Santos',
        message: 'Cliente excluído com sucesso'
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Cliente não encontrado'
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Cliente possui transações associadas',
    schema: {
      example: {
        statusCode: 409,
        message: 'Não é possível excluir cliente com transações associadas',
        error: 'Conflict'
      }
    }
  })
  remove(
    @Param('id') id: string, 
    @CurrentUserId() userId: string
  ) {
    return this.clientsService.remove(id, userId);
  }
} 