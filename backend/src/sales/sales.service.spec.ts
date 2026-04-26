import { Test, TestingModule } from '@nestjs/testing';
import { TenantResolutionService } from '../core/application/tenant-resolution.service';
import { PaymentStatus } from '../database/domain.enums';
import { SalesApplicationService } from './application/sales.application-service';
import { SaleRepository } from './domain/repositories/sale.repository';

describe('SalesService (escopo: Vendas)', () => {
  let service: SalesApplicationService;

  it('create sem parcelas: Transaction e Vehicle carregam updatedAt', async () => {
    const txId = 'tx-100';
    const fullRow = {
      id: txId,
      amount: 50_000,
      Vehicle: { brand: 'Fiat', model: 'Uno' },
      Client: { name: 'João' },
      Installment: [],
    };

    const insertTransaction = jest.fn().mockResolvedValue(undefined);
    const updateVehicleAfterSale = jest.fn().mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesApplicationService,
        {
          provide: SaleRepository,
          useValue: {
            listVehicleIdsByTenant: jest.fn(),
            findVehicleForSale: jest.fn().mockResolvedValue({ status: 'AVAILABLE' }),
            clientExistsInTenant: jest.fn().mockResolvedValue(true),
            insertTransaction,
            deleteTransaction: jest.fn(),
            insertInstallments: jest.fn(),
            deleteInstallmentsByTransaction: jest.fn(),
            updateVehicleAfterSale,
            fetchTransactionFull: jest.fn().mockResolvedValue(fullRow),
            listSaleTransactionsForVehicles: jest.fn(),
            findTransactionSaleById: jest.fn(),
            updateTransactionRecord: jest.fn(),
            updateTransactionSaleFields: jest.fn(),
            findInstallmentByTxAndNumber: jest.fn(),
            updateInstallmentPaid: jest.fn(),
            listInstallmentStatuses: jest.fn(),
            markTransactionPaid: jest.fn(),
            listTransactionsForStats: jest.fn(),
            listVehiclesBrief: jest.fn(),
            listPendingInstallmentsDueBefore: jest.fn(),
            softDeactivateTransaction: jest.fn(),
            revertVehicleSaleState: jest.fn(),
            vehicleExistsInTenant: jest.fn(),
          },
        },
        {
          provide: TenantResolutionService,
          useValue: { getTenantIdByUserIdOrThrow: jest.fn().mockResolvedValue('ten-1') },
        },
      ],
    }).compile();

    service = module.get(SalesApplicationService);
    const sale = await service.create(
      {
        vehicleId: 'v1',
        clientId: 'cli-1',
        amount: 50_000,
      } as never,
      'user-1',
    );

    expect(sale).toMatchObject({ id: txId });
    expect(sale.vehicle).toBeDefined();

    const txCall = insertTransaction.mock.calls[0] as [Record<string, unknown>] | undefined;
    expect(txCall).toBeDefined();
    const txRow = txCall![0];
    expect(typeof txRow['updatedAt']).toBe('string');
    expect(txRow['tenantId']).toBe('ten-1');
    expect(txRow['type']).toBe('SALE');
    expect(txRow['status']).toBe(PaymentStatus.PAID);

    expect((updateVehicleAfterSale.mock.calls[0] as [string, Record<string, unknown>] | undefined)?.[0]).toBe(
      'v1',
    );
    const vehPatch = (updateVehicleAfterSale.mock.calls[0] as [string, Record<string, unknown>] | undefined)?.[1];
    expect(vehPatch).toBeDefined();
    expect(vehPatch?.['status']).toBe('SOLD');
    expect(typeof vehPatch?.['updatedAt']).toBe('string');
  });
});
