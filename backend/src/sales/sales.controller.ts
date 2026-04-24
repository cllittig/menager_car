import {
    Body,
    Controller,
    Delete,
    Get,
    HttpStatus,
    Param,
    ParseIntPipe,
    Patch,
    Post
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
import { CreateSaleDto } from './dto/create-sale.dto';
import { SalesService } from './sales.service';

@ApiTags('Vendas')
@ApiBearerAuth()
@Roles(...OPERATIONAL_ROLES)
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Registrar nova venda',
    description: 'Registra uma nova venda de veículo com parcelas opcionais'
  })
  @ApiBody({ type: CreateSaleDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Venda registrada com sucesso',
    schema: {
      example: {
        id: 'uuid-example',
        vehicleId: 'vehicle-uuid',
        clientId: 'client-uuid',
        type: 'SALE',
        amount: 50000,
        status: 'PENDING',
        createdAt: '2025-06-19T14:30:00Z',
        vehicle: {
          brand: 'Toyota',
          model: 'Corolla',
          year: 2023,
          licensePlate: 'ABC-1234'
        },
        client: {
          name: 'João Silva Santos',
          email: 'joao.silva@email.com'
        },
        installments: [
          {
            number: 1,
            amount: 25000,
            dueDate: '2025-07-19T00:00:00Z',
            status: 'PENDING'
          }
        ]
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Veículo ou cliente não encontrado'
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Veículo não está disponível para venda'
  })
  create(@Body() createSaleDto: CreateSaleDto, @CurrentUserId() userId: string) {
    return this.salesService.create(createSaleDto, userId);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Listar todas as vendas do usuário',
    description: 'Retorna lista de todas as vendas do usuário com detalhes dos veículos e clientes'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de vendas retornada com sucesso',
    schema: {
      example: [
        {
          id: 'uuid-example',
          amount: 50000,
          status: 'PAID',
          createdAt: '2025-06-19T14:30:00Z',
          vehicle: {
            brand: 'Toyota',
            model: 'Corolla',
            year: 2023,
            licensePlate: 'ABC-1234',
            color: 'Branco'
          },
          client: {
            name: 'João Silva Santos',
            email: 'joao.silva@email.com',
            phone: '(11) 99999-9999'
          },
          installments: [],
          contract: {
            id: 'contract-uuid',
            fileName: 'contrato_venda.pdf',
            uploadDate: '2025-06-19T15:00:00Z'
          }
        }
      ]
    }
  })
  findAll(@CurrentUserId() userId: string) {
    return this.salesService.findAll(userId);
  }

  @Get('stats')
  @ApiOperation({ 
    summary: 'Estatísticas de vendas do usuário',
    description: 'Retorna estatísticas detalhadas das vendas do usuário (receita, vendas mensais, etc.)'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Estatísticas retornadas com sucesso',
    schema: {
      example: {
        totalSales: 120,
        salesThisMonth: 15,
        totalRevenue: 2500000,
        monthlyRevenue: 450000,
        salesByStatus: [
          { status: 'PAID', _count: { id: 80 }, _sum: { amount: 2000000 } },
          { status: 'PENDING', _count: { id: 30 }, _sum: { amount: 450000 } }
        ],
        topVehicles: [
          {
            vehicle: { brand: 'BMW', model: 'X5', year: 2022 },
            amount: 180000,
            date: '2025-06-15T10:00:00Z'
          }
        ]
      }
    }
  })
  getStats(@CurrentUserId() userId: string) {
    return this.salesService.getSalesStats(userId);
  }

  @Get('pending-payments')
  @ApiOperation({ 
    summary: 'Pagamentos pendentes do usuário',
    description: 'Retorna parcelas do usuário com vencimento nos próximos 7 dias'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pagamentos pendentes retornados com sucesso',
    schema: {
      example: [
        {
          id: 'installment-uuid',
          number: 2,
          amount: 25000,
          dueDate: '2025-06-25T00:00:00Z',
          status: 'PENDING',
          transaction: {
            client: {
              name: 'João Silva Santos',
              phone: '(11) 99999-9999',
              email: 'joao.silva@email.com'
            },
            vehicle: {
              brand: 'Toyota',
              model: 'Corolla',
              licensePlate: 'ABC-1234'
            }
          }
        }
      ]
    }
  })
  getPendingPayments(@CurrentUserId() userId: string) {
    return this.salesService.getPendingPayments(userId);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Buscar venda do usuário por ID',
    description: 'Retorna uma venda específica do usuário com todos os detalhes'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID único da venda', 
    example: 'uuid-example' 
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Venda encontrada com sucesso'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Venda não encontrada'
  })
  findOne(@Param('id') id: string, @CurrentUserId() userId: string) {
    return this.salesService.findOne(id, userId);
  }

  @Patch(':id/payment-status')
  @ApiOperation({ 
    summary: 'Atualizar status de pagamento',
    description: 'Atualiza o status de pagamento de uma venda do usuário'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID único da venda', 
    example: 'uuid-example' 
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['PENDING', 'PAID', 'OVERDUE', 'CANCELLED'],
          example: 'PAID'
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Status atualizado com sucesso'
  })
  updatePaymentStatus(
    @Param('id') id: string, 
    @Body('status') status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED',
    @CurrentUserId() userId: string
  ) {
    return this.salesService.updatePaymentStatus(id, status, userId);
  }

  @Patch(':id/pay-installment/:installmentNumber')
  @ApiOperation({ 
    summary: 'Pagar parcela',
    description: 'Marca uma parcela específica como paga para venda do usuário'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID único da venda', 
    example: 'uuid-example' 
  })
  @ApiParam({ 
    name: 'installmentNumber', 
    description: 'Número da parcela', 
    example: 1
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Parcela paga com sucesso',
    schema: {
      example: {
        id: 'installment-uuid',
        number: 1,
        amount: 25000,
        dueDate: '2025-07-19T00:00:00Z',
        status: 'PAID',
        paidAt: '2025-06-19T16:30:00Z'
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Venda ou parcela não encontrada'
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Parcela já foi paga'
  })
  payInstallment(
    @Param('id') id: string,
    @Param('installmentNumber', ParseIntPipe) installmentNumber: number,
    @CurrentUserId() userId: string
  ) {
    return this.salesService.payInstallment(id, installmentNumber, userId);
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Excluir venda',
    description: 'Exclui uma venda do usuário (soft delete)'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID único da venda', 
    example: 'uuid-example' 
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Venda excluída com sucesso'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Venda não encontrada'
  })
  delete(@Param('id') id: string, @CurrentUserId() userId: string) {
    return this.salesService.delete(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ 
    summary: 'Atualizar venda',
    description: 'Atualiza dados básicos de uma venda do usuário'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID único da venda', 
    example: 'uuid-example' 
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        vehicleId: { type: 'string', example: 'vehicle-uuid' },
        clientId: { type: 'string', example: 'client-uuid' },
        amount: { type: 'number', example: 50000 },
        saleDate: { type: 'string', format: 'date', example: '2025-06-19' }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Venda atualizada com sucesso'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Venda não encontrada'
  })
  update(@Param('id') id: string, @Body() updateData: Partial<CreateSaleDto>, @CurrentUserId() userId: string) {
    return this.salesService.update(id, updateData, userId);
  }
} 