import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { TenantResolutionService } from '../../core/application/tenant-resolution.service';
import { ContractRepository } from '../domain/repositories/contract.repository';
import { CreateContractDto, UploadContractDto } from '../dto/create-contract.dto';
import { UpdateContractDto } from '../dto/update-contract.dto';

@Injectable()
export class ContractsApplicationService {
  constructor(
    private readonly tenantResolution: TenantResolutionService,
    private readonly contractRepository: ContractRepository,
  ) {}

  async create(createContractDto: CreateContractDto, userId: string) {
    const tenantId = await this.tenantResolution.getTenantIdByUserIdOrThrow(userId);
    const transaction = await this.contractRepository.getTransactionBasics(
      createContractDto.transactionId,
    );

    if (!transaction) {
      throw new NotFoundException('Transação não encontrada');
    }
    if (transaction.tenantId !== tenantId) {
      throw new NotFoundException('Transação não encontrada');
    }

    const hasContract = await this.contractRepository.existsForTransaction(
      createContractDto.transactionId,
    );
    if (hasContract) {
      throw new ConflictException('Esta transação já possui um contrato associado');
    }

    const fileBuffer = Buffer.from(createContractDto.fileBuffer, 'base64');
    const now = new Date().toISOString();

    const ins = await this.contractRepository.insertContract({
      id: randomUUID(),
      transactionId: createContractDto.transactionId,
      fileName: createContractDto.fileName,
      mimeType: createContractDto.mimeType,
      fileSize: createContractDto.fileSize,
      fileHash: createContractDto.fileHash,
      fileBuffer,
      tenantId,
      updatedAt: now,
    });
    const { Transaction: tr, ...rest } = ins;
    return { ...rest, transaction: tr };
  }

  async createFromUpload(file: Express.Multer.File, uploadData: UploadContractDto, userId: string) {
    const tenantId = await this.tenantResolution.getTenantIdByUserIdOrThrow(userId);
    if (!file) {
      throw new BadRequestException('Arquivo é obrigatório');
    }

    const transaction = await this.contractRepository.getTransactionForUpload(uploadData.transactionId);

    if (!transaction) {
      throw new NotFoundException('Transação não encontrada');
    }
    if (transaction.tenantId !== tenantId) {
      throw new NotFoundException('Transação não encontrada');
    }

    const hasContract = await this.contractRepository.existsForTransaction(uploadData.transactionId);
    if (hasContract) {
      throw new ConflictException('Esta transação já possui um contrato associado');
    }

    const today = new Date();
    const day = today.getDate().toString().padStart(2, '0');
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const year = today.getFullYear().toString();

    const licensePlate = transaction.Vehicle?.licensePlate || 'SEM_PLACA';
    const plateFormatted = licensePlate.replace('-', '_');
    const contractId = `${plateFormatted}_${day}_${month}_${year}`;

    let finalContractId = contractId;
    let counter = 1;
    let dupRows = await this.contractRepository.listIdsByFileNamePrefix(tenantId, finalContractId);
    while (dupRows.length > 0) {
      finalContractId = `${contractId}_${counter}`;
      counter++;
      dupRows = await this.contractRepository.listIdsByFileNamePrefix(tenantId, finalContractId);
    }

    const fileExtension = file.originalname.split('.').pop() || 'pdf';
    const finalFileName = `${finalContractId}.${fileExtension}`;
    const now = new Date().toISOString();

    const ins = await this.contractRepository.insertContract({
      id: randomUUID(),
      transactionId: uploadData.transactionId,
      fileName: finalFileName,
      mimeType: file.mimetype,
      fileSize: file.size,
      fileHash: `${Date.now()}-${finalContractId}`,
      fileBuffer: file.buffer,
      tenantId,
      updatedAt: now,
    });
    const { Transaction: tr, ...rest } = ins;
    return { ...rest, transaction: tr };
  }

  async findAll(userId: string) {
    const tenantId = await this.tenantResolution.getTenantIdByUserIdOrThrow(userId);
    const rows = await this.contractRepository.listAllForTenantRaw(tenantId);

    return (rows as Record<string, unknown>[]).map((c) => {
      const tx = c.Transaction as Record<string, unknown> | undefined;
      const veh = tx?.Vehicle as Record<string, unknown> | undefined;
      const cli = tx?.Client as Record<string, unknown> | undefined;
      return {
        id: c.id,
        transactionId: c.transactionId,
        fileName: c.fileName,
        mimeType: c.mimeType,
        fileSize: c.fileSize,
        uploadDate: c.uploadDate,
        transactionType: tx?.type,
        transactionAmount: tx?.amount,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        vehicleBrand: veh?.brand,
        vehicleModel: veh?.model,
        clientName: cli?.name,
      };
    });
  }

  async findOne(id: string, userId: string) {
    const tenantId = await this.tenantResolution.getTenantIdByUserIdOrThrow(userId);
    const res = await this.contractRepository.findOneJoined(id, tenantId);

    if (!res) {
      throw new NotFoundException('Contrato não encontrado');
    }
    const { Transaction: tr, ...rest } = res;
    return { ...rest, transaction: tr };
  }

  async downloadContract(id: string, userId: string) {
    const contract = (await this.findOne(id, userId)) as {
      fileName: string;
      mimeType: string;
      fileSize: number;
      fileBuffer: unknown;
      transaction: unknown;
    };

    return {
      fileName: contract.fileName,
      mimeType: contract.mimeType,
      fileSize: contract.fileSize,
      fileBuffer: contract.fileBuffer,
      transaction: contract.transaction,
    };
  }

  async findByTransaction(transactionId: string, userId: string) {
    const tenantId = await this.tenantResolution.getTenantIdByUserIdOrThrow(userId);
    const res = await this.contractRepository.findByTransactionJoined(transactionId, tenantId);
    if (!res) {
      return null;
    }
    const { Transaction: tr, ...rest } = res;
    return { ...rest, transaction: tr };
  }

  async update(id: string, userId: string, dto: UpdateContractDto) {
    const tenantId = await this.tenantResolution.getTenantIdByUserIdOrThrow(userId);
    await this.findOne(id, userId);
    const trimmed = dto.fileName.trim();
    if (!trimmed) {
      throw new BadRequestException('Nome do arquivo não pode ser vazio');
    }
    const now = new Date().toISOString();
    return this.contractRepository.updateFileMeta(id, tenantId, trimmed, now);
  }

  async remove(id: string, userId: string) {
    const contract = (await this.findOne(id, userId)) as unknown as { id: string };
    return this.contractRepository.deleteReturning(contract.id);
  }

  async getAvailableTransactions(userId: string) {
    const tenantId = await this.tenantResolution.getTenantIdByUserIdOrThrow(userId);
    const txIds = await this.contractRepository.listActiveTransactionIds(tenantId);
    if (txIds.length === 0) {
      return [];
    }

    const withContract = new Set(await this.contractRepository.listContractTransactionIds(tenantId));
    const availableIds = txIds.filter((tid) => !withContract.has(tid));
    if (availableIds.length === 0) {
      return [];
    }

    const list = await this.contractRepository.listTransactionsWithRelations(availableIds);
    return (list as Record<string, unknown>[]).map((r) => {
      const { Client: cli, Vehicle: veh, ...rest } = r;
      return { ...rest, client: cli, vehicle: veh };
    });
  }

  async getContractStats(userId: string) {
    const tenantId = await this.tenantResolution.getTenantIdByUserIdOrThrow(userId);

    const totalContracts = await this.contractRepository.countByTenant(tenantId);

    const startMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const contractsThisMonth = await this.contractRepository.countByTenantSince(
      tenantId,
      startMonth,
    );

    const withType = await this.contractRepository.listWithNestedTransactionType(tenantId);

    const contractTypeStats = (withType as Record<string, unknown>[]).reduce(
      (acc: Record<string, number>, row: Record<string, unknown>) => {
        const tx = row.Transaction;
        const t =
          Array.isArray(tx) && tx[0] && typeof tx[0] === 'object' && 'type' in tx[0]
            ? String((tx[0] as { type: string }).type)
            : tx && typeof tx === 'object' && 'type' in tx
              ? String((tx as { type: string }).type)
              : 'UNKNOWN';
        acc[t] = (acc[t] || 0) + 1;
        return acc;
      },
      {},
    );

    return {
      totalContracts,
      contractsThisMonth,
      contractsByType: contractTypeStats,
    };
  }
}
