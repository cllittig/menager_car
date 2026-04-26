import { Test, TestingModule } from '@nestjs/testing';
import { TenantResolutionService } from '../core/application/tenant-resolution.service';
import { ContractsApplicationService } from './application/contracts.application-service';
import { ContractRepository } from './domain/repositories/contract.repository';

describe('ContractsService (escopo: Contratos)', () => {
  let service: ContractsApplicationService;

  it('create grava updatedAt no contrato', async () => {
    const row = {
      id: 'ct-1',
      transactionId: 'tx-9',
      fileName: 'c.pdf',
      tenantId: 'ten-1',
      Transaction: { Client: {}, Vehicle: {} },
    };

    const insertContract = jest.fn().mockResolvedValue(row);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractsApplicationService,
        {
          provide: ContractRepository,
          useValue: {
            getTransactionBasics: jest.fn().mockResolvedValue({ id: 'tx-9', tenantId: 'ten-1' }),
            existsForTransaction: jest.fn().mockResolvedValue(false),
            insertContract,
            getTransactionForUpload: jest.fn(),
            listIdsByFileNamePrefix: jest.fn(),
            listAllForTenantRaw: jest.fn(),
            findOneJoined: jest.fn(),
            updateFileMeta: jest.fn(),
            deleteReturning: jest.fn(),
            listActiveTransactionIds: jest.fn(),
            listContractTransactionIds: jest.fn(),
            listTransactionsWithRelations: jest.fn(),
            countByTenant: jest.fn(),
            countByTenantSince: jest.fn(),
            listWithNestedTransactionType: jest.fn(),
            findByTransactionJoined: jest.fn(),
          },
        },
        {
          provide: TenantResolutionService,
          useValue: { getTenantIdByUserIdOrThrow: jest.fn().mockResolvedValue('ten-1') },
        },
      ],
    }).compile();

    service = module.get(ContractsApplicationService);
    await service.create(
      {
        transactionId: 'tx-9',
        fileName: 'c.pdf',
        mimeType: 'application/pdf',
        fileSize: 10,
        fileHash: 'hash',
        fileBuffer: Buffer.from('x').toString('base64'),
      } as never,
      'user-1',
    );

    const call = insertContract.mock.calls[0] as [Record<string, unknown>] | undefined;
    expect(call).toBeDefined();
    const ins = call![0];
    expect(ins['tenantId']).toBe('ten-1');
    expect(typeof ins['updatedAt']).toBe('string');
  });
});
