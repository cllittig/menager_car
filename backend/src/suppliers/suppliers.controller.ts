import { Body, Controller, Delete, Get, Param, Patch, Post, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { SuppliersService } from './suppliers.service';

@ApiTags('Fornecedores')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  @ApiOperation({ summary: 'Cadastrar fornecedor' })
  create(@Body(new ValidationPipe({ whitelist: true })) dto: CreateSupplierDto, @CurrentUserId() userId: string) {
    return this.suppliersService.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar fornecedores' })
  findAll(@CurrentUserId() userId: string) {
    return this.suppliersService.findAll(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUserId() userId: string) {
    return this.suppliersService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar fornecedor' })
  update(
    @Param('id') id: string,
    @Body(new ValidationPipe({ whitelist: true })) dto: UpdateSupplierDto,
    @CurrentUserId() userId: string,
  ) {
    return this.suppliersService.update(id, dto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover fornecedor' })
  remove(@Param('id') id: string, @CurrentUserId() userId: string) {
    return this.suppliersService.remove(id, userId);
  }
}
