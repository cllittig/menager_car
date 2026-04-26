import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { OPERATIONAL_ROLES } from '../auth/roles.constants';
import { CreateProductDto } from './dto/create-product.dto';
import { AdjustStockDto, CreateStockMovementDto } from './dto/stock-movement.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@ApiTags('Produtos e estoque')
@ApiBearerAuth()
@Roles(...OPERATIONAL_ROLES)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Cadastrar produto' })
  create(@Body(new ValidationPipe({ whitelist: true })) dto: CreateProductDto, @CurrentUserId() userId: string) {
    return this.productsService.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar produtos' })
  findAll(@CurrentUserId() userId: string) {
    return this.productsService.findAll(userId);
  }

  @Get('movements')
  @ApiOperation({ summary: 'Histórico de movimentações de estoque' })
  @ApiQuery({ name: 'productId', required: false })
  listMovements(@CurrentUserId() userId: string, @Query('productId') productId?: string) {
    return this.productsService.listMovements(userId, productId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar produto' })
  findOne(@Param('id') id: string, @CurrentUserId() userId: string) {
    return this.productsService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar produto sem alterar quantidade' })
  update(
    @Param('id') id: string,
    @Body(new ValidationPipe({ whitelist: true })) dto: UpdateProductDto,
    @CurrentUserId() userId: string,
  ) {
    return this.productsService.update(id, dto, userId);
  }

  @Patch(':id/stock')
  @ApiOperation({ summary: 'Ajustar quantidade em estoque (registro ADJUST)' })
  adjustStock(
    @Param('id') id: string,
    @Body(new ValidationPipe({ whitelist: true })) dto: AdjustStockDto,
    @CurrentUserId() userId: string,
  ) {
    return this.productsService.adjustStock(id, dto, userId);
  }

  @Post(':id/movements')
  @ApiOperation({ summary: 'Entrada ou saída de estoque' })
  addMovement(
    @Param('id') id: string,
    @Body(new ValidationPipe({ whitelist: true })) dto: CreateStockMovementDto,
    @CurrentUserId() userId: string,
  ) {
    return this.productsService.addMovement(id, dto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover produto (se não houver vínculos bloqueantes)' })
  remove(@Param('id') id: string, @CurrentUserId() userId: string) {
    return this.productsService.remove(id, userId);
  }
}
