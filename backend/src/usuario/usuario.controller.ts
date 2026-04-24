import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiBody,
  ApiBearerAuth 
} from '@nestjs/swagger';
import { UsuarioService } from './usuario.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { CurrentUser, type CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('users')
@ApiBearerAuth()
@Controller('usuario')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @Public()
  @Post()
  @ApiOperation({ 
    summary: 'Criar usuário', 
    description: 'Cria um novo usuário no sistema' 
  })
  @ApiBody({ 
    type: CreateUsuarioDto,
    description: 'Dados do usuário a ser criado',
    examples: {
      example1: {
        summary: 'Exemplo de usuário',
        value: {
          nome: 'João Silva',
          email: 'joao@exemplo.com',
          senha: 'minhasenha123'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Usuário criado com sucesso',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        message: { type: 'string', example: 'Usuario cadastrado com sucesso' }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Dados de entrada inválidos' 
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Erro interno do servidor' 
  })
  create(@Body() createUsuarioDto: CreateUsuarioDto) {
    return this.usuarioService.create(createUsuarioDto);
  }

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ 
    summary: 'Listar usuários', 
    description: 'Retorna a lista de todos os usuários cadastrados' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de usuários retornada com sucesso',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'uuid' },
          name: { type: 'string', example: 'João Silva' },
          email: { type: 'string', example: 'joao@exemplo.com' },
          role: { type: 'string', example: 'USER' },
          isActive: { type: 'boolean', example: true }
        }
      }
    }
  })
  findAll(@CurrentUser() user: CurrentUserPayload) {
    return this.usuarioService.findAllByTenant(user.tenantId);
  }

  @Get(':id')
  @Roles('ADMIN')
  @ApiOperation({ 
    summary: 'Buscar usuário por ID', 
    description: 'Retorna os dados de um usuário específico' 
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID único do usuário (UUID)', 
    example: '123e4567-e89b-12d3-a456-426614174000' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Usuário encontrado',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'uuid' },
        name: { type: 'string', example: 'João Silva' },
        email: { type: 'string', example: 'joao@exemplo.com' },
        role: { type: 'string', example: 'USER' },
        isActive: { type: 'boolean', example: true }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Usuário não encontrado' 
  })
  async findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    const row = await this.usuarioService.findOneInTenant(id, user.tenantId);
    if (!row) throw new NotFoundException('Usuário não encontrado');
    return row;
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ 
    summary: 'Atualizar usuário', 
    description: 'Atualiza os dados de um usuário existente' 
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID único do usuário (UUID)', 
    example: '123e4567-e89b-12d3-a456-426614174000' 
  })
  @ApiBody({ 
    type: UpdateUsuarioDto,
    description: 'Dados a serem atualizados',
    examples: {
      example1: {
        summary: 'Atualizar nome e email',
        value: {
          nome: 'João Santos',
          email: 'joao.santos@exemplo.com'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Usuário atualizado com sucesso',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 200 },
        message: { type: 'string', example: 'Usuario atualizado com sucesso' }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Usuário não encontrado' 
  })
  update(
    @Param('id') id: string,
    @Body() updateUsuarioDto: UpdateUsuarioDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.usuarioService.update(id, updateUsuarioDto, user.tenantId);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ 
    summary: 'Remover usuário', 
    description: 'Remove um usuário do sistema' 
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID único do usuário (UUID)', 
    example: '123e4567-e89b-12d3-a456-426614174000' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Usuário removido com sucesso',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 200 },
        message: { type: 'string', example: 'Usuario removido com sucesso' }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Usuário não encontrado' 
  })
  remove(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.usuarioService.remove(id, user.tenantId);
  }
}
