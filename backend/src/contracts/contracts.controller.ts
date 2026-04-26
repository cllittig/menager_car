import {
    Body,
    Controller,
    Delete,
    Get,
    HttpStatus,
    Param,
    Patch,
    Post,
    Res,
    UploadedFile,
    UseInterceptors,
    ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
    ApiBearerAuth,
    ApiBody,
    ApiConsumes,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { CurrentUserId } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { OPERATIONAL_ROLES } from '../auth/roles.constants';
import { ContractsService } from './contracts.service';
import { UploadContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';

@ApiTags('Contratos')
@ApiBearerAuth()
@Roles(...OPERATIONAL_ROLES)
@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload de contrato' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Upload de contrato com arquivo',
    type: UploadContractDto,
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo do contrato (PDF, DOC, DOCX, TXT)'
        },
        transactionId: {
          type: 'string',
          example: 'uuid-transaction-example'
        },
        transactionType: {
          type: 'string',
          enum: ['PURCHASE', 'SALE', 'MAINTENANCE'],
          example: 'SALE'
        },
        transactionAmount: {
          type: 'string',
          example: '50000'
        }
      },
      required: ['file', 'transactionId', 'transactionType', 'transactionAmount']
    }
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Contrato enviado com sucesso' })
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadData: UploadContractDto,
    @CurrentUserId() userId: string
  ) {
    return this.contractsService.createFromUpload(file, uploadData, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os contratos' })
  findAll(@CurrentUserId() userId: string) {
    return this.contractsService.findAll(userId);
  }

  @Get('available-transactions')
  @ApiOperation({ summary: 'Buscar transações disponíveis para contrato' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Lista de transações sem contrato' })
  getAvailableTransactions(@CurrentUserId() userId: string) {
    return this.contractsService.getAvailableTransactions(userId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Estatísticas de contratos' })
  getStats(@CurrentUserId() userId: string) {
    return this.contractsService.getContractStats(userId);
  }

  @Get('transaction/:transactionId')
  @ApiOperation({ summary: 'Buscar contrato por transação' })
  @ApiParam({ name: 'transactionId', description: 'ID da transação' })
  findByTransaction(@Param('transactionId') transactionId: string, @CurrentUserId() userId: string) {
    return this.contractsService.findByTransaction(transactionId, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar contrato por ID' })
  @ApiParam({ name: 'id', description: 'ID do contrato' })
  findOne(@Param('id') id: string, @CurrentUserId() userId: string) {
    return this.contractsService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar metadados do contrato (ex.: nome do arquivo)' })
  @ApiParam({ name: 'id', description: 'ID do contrato' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Contrato atualizado' })
  update(
    @Param('id') id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) dto: UpdateContractDto,
    @CurrentUserId() userId: string,
  ) {
    return this.contractsService.update(id, userId, dto);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download do arquivo do contrato' })
  @ApiParam({ name: 'id', description: 'ID do contrato' })
  async downloadContract(@Param('id') id: string, @CurrentUserId() userId: string, @Res() res: Response) {
    try {
      const contract = await this.contractsService.downloadContract(id, userId);
      
      res.set({
        'Content-Type': contract.mimeType,
        'Content-Disposition': `attachment; filename="${contract.fileName}"`,
        'Content-Length': contract.fileSize.toString(),
      });
      
      return res.end(contract.fileBuffer);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      return res.status(500).json({
        message: 'Erro ao baixar contrato',
        error: message,
      });
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir contrato' })
  @ApiParam({ name: 'id', description: 'ID do contrato' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Contrato excluído com sucesso' })
  remove(@Param('id') id: string, @CurrentUserId() userId: string) {
    return this.contractsService.remove(id, userId);
  }
} 