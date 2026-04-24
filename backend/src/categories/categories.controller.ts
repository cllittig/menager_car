import { Body, Controller, Delete, Get, Param, Patch, Post, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('Categorias')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Cadastrar categoria' })
  create(@Body(new ValidationPipe({ whitelist: true })) dto: CreateCategoryDto, @CurrentUserId() userId: string) {
    return this.categoriesService.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar categorias da empresa' })
  findAll(@CurrentUserId() userId: string) {
    return this.categoriesService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar categoria' })
  findOne(@Param('id') id: string, @CurrentUserId() userId: string) {
    return this.categoriesService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar categoria' })
  update(
    @Param('id') id: string,
    @Body(new ValidationPipe({ whitelist: true })) dto: UpdateCategoryDto,
    @CurrentUserId() userId: string,
  ) {
    return this.categoriesService.update(id, dto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover categoria' })
  remove(@Param('id') id: string, @CurrentUserId() userId: string) {
    return this.categoriesService.remove(id, userId);
  }
}
