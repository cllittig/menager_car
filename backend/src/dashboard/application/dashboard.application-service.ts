import { Injectable } from '@nestjs/common';
import { TenantResolutionService } from '../../core/application/tenant-resolution.service';
import { PaymentStatus, TransactionType } from '../../database/domain.enums';
import { DashboardRepository } from '../domain/repositories/dashboard.repository';

export interface DashboardTopSoldModel {
  brand: string;
  model: string;
  year: number | null;
  salesCount: number;
}

export interface DashboardMonthRevenue {
  year: number;
  month: number;
  amount: number;
}

export interface DashboardStats {
  totalVehicles: number;
  availableVehicles: number;
  soldVehicles: number;
  maintenanceVehicles: number;
  totalClients: number;
  monthlySales: number;
  totalRevenue: number;
  maintenanceCosts: number;
  activeContracts: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  monthlyProfit: number;
  vehiclesPurchasedThisMonth: number;
  vehiclesSoldThisMonth: number;
  averageSalePrice: number;
  averagePurchasePrice: number;
  profitMargin: number;
  /** Aliases para telas legadas (ex.: src/app/(dashboard)/dashboard/page.tsx) */
  subscriptions: number;
  sales: number;
  activeNow: number;
  /** Marca + modelo com mais transações de venda (não canceladas). */
  topSoldModel: DashboardTopSoldModel | null;
  /** Últimos 6 meses calendário (inclui o mês atual), receita de vendas. */
  revenueLast6Months: DashboardMonthRevenue[];
}

function normalizeModelKey(brand: string, model: string): string {
  return `${brand.trim().toLowerCase()}::${model.trim().toLowerCase()}`;
}

function buildTopSoldModel(
  txs: Array<{ type: TransactionType; status: PaymentStatus; vehicleId: string }>,
  vehicles: Array<{ id: string; brand: string; model: string; year: number }>,
  isCountedSale: (t: { type: TransactionType; status: PaymentStatus }) => boolean,
): DashboardTopSoldModel | null {
  const vidToVehicle = new Map(vehicles.map((v) => [v.id, v]));
  const countsByKey = new Map<
    string,
    { brand: string; model: string; salesCount: number; years: number[] }
  >();
  for (const t of txs) {
    if (!isCountedSale(t)) continue;
    const veh = vidToVehicle.get(t.vehicleId);
    if (!veh) continue;
    const key = normalizeModelKey(veh.brand, veh.model);
    const prev = countsByKey.get(key);
    if (prev) {
      prev.salesCount += 1;
      prev.years.push(veh.year);
    } else {
      countsByKey.set(key, {
        brand: veh.brand,
        model: veh.model,
        salesCount: 1,
        years: [veh.year],
      });
    }
  }
  let best: { brand: string; model: string; salesCount: number; years: number[] } | null = null;
  for (const row of countsByKey.values()) {
    if (!best || row.salesCount > best.salesCount) {
      best = row;
    } else if (best && row.salesCount === best.salesCount) {
      const cmp = `${row.brand} ${row.model}`.localeCompare(`${best.brand} ${best.model}`, 'pt');
      if (cmp < 0) best = row;
    }
  }
  if (!best) return null;
  const year =
    best.years.length > 0
      ? Math.round(best.years.reduce((a, b) => a + b, 0) / best.years.length)
      : null;
  return {
    brand: best.brand,
    model: best.model,
    year,
    salesCount: best.salesCount,
  };
}

function buildRevenueLast6Months(
  txs: Array<{ type: TransactionType; status: PaymentStatus; amount: number; createdAt: string }>,
  isCountedSale: (t: { type: TransactionType; status: PaymentStatus }) => boolean,
  now: Date,
): DashboardMonthRevenue[] {
  const buckets: DashboardMonthRevenue[] = [];
  for (let offset = 5; offset >= 0; offset -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    buckets.push({ year: d.getFullYear(), month: d.getMonth() + 1, amount: 0 });
  }
  const keyOf = (y: number, m: number) => `${y}-${String(m).padStart(2, '0')}`;
  const idxMap = new Map(buckets.map((b, i) => [keyOf(b.year, b.month), i] as const));
  for (const t of txs) {
    if (!isCountedSale(t)) continue;
    const ym = t.createdAt.slice(0, 7);
    const idx = idxMap.get(ym);
    if (idx !== undefined) {
      buckets[idx].amount += t.amount;
    }
  }
  return buckets;
}

@Injectable()
export class DashboardApplicationService {
  constructor(
    private readonly tenantResolution: TenantResolutionService,
    private readonly dashboardRepository: DashboardRepository,
  ) {}

  async getStats(userId: string): Promise<DashboardStats> {
    try {
      const tenantId = await this.tenantResolution.getTenantIdByUserIdOrThrow(userId);
      const vids = await this.dashboardRepository.listVehicleIdsByTenant(tenantId);

      const [totalVehicles, availableVehicles, soldVehicles, maintenanceVehicles] =
        await Promise.all([
          this.dashboardRepository.countVehicles(tenantId, {}),
          this.dashboardRepository.countVehicles(tenantId, { status: 'AVAILABLE' }),
          this.dashboardRepository.countVehicles(tenantId, { status: 'SOLD' }),
          this.dashboardRepository.countVehicles(tenantId, { status: 'MAINTENANCE' }),
        ]);

      const totalClients = await this.dashboardRepository.countActiveClients(tenantId);

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);

      if (vids.length === 0) {
        return {
          totalVehicles,
          availableVehicles,
          soldVehicles,
          maintenanceVehicles,
          totalClients,
          monthlySales: 0,
          totalRevenue: 0,
          maintenanceCosts: 0,
          activeContracts: 0,
          monthlyRevenue: 0,
          monthlyExpenses: 0,
          monthlyProfit: 0,
          vehiclesPurchasedThisMonth: 0,
          vehiclesSoldThisMonth: 0,
          averageSalePrice: 0,
          averagePurchasePrice: 0,
          profitMargin: 0,
          subscriptions: totalClients,
          sales: 0,
          activeNow: availableVehicles,
          topSoldModel: null,
          revenueLast6Months: buildRevenueLast6Months([], () => false, now),
        };
      }

      const [txs, vehiclesBrief, maintRows] = await Promise.all([
        this.dashboardRepository.listTransactionsForVehicles(vids),
        this.dashboardRepository.listVehiclesBriefByTenant(tenantId),
        this.dashboardRepository.sumCompletedMaintenanceCosts(vids),
      ]);

      const inMonth = (d: string) => {
        const t = new Date(d).getTime();
        return t >= monthStart.getTime() && t < monthEnd.getTime();
      };

      /** Vendas concretizadas no sistema: exclui apenas canceladas (à vista entra como PENDING até marcar pago). */
      const isCountedSale = (t: { type: TransactionType; status: PaymentStatus }) =>
        t.type === TransactionType.SALE && t.status !== PaymentStatus.CANCELLED;

      const monthlyRevenue = txs
        .filter((t) => isCountedSale(t) && inMonth(t.createdAt))
        .reduce((s, t) => s + t.amount, 0);

      const monthlyExpenses = txs
        .filter((t) => t.type === TransactionType.PURCHASE && inMonth(t.createdAt))
        .reduce((s, t) => s + t.amount, 0);

      const monthlySalesCount = txs.filter((t) => isCountedSale(t) && inMonth(t.createdAt)).length;

      const vehiclesPurchasedThisMonth = txs.filter(
        (t) => t.type === TransactionType.PURCHASE && inMonth(t.createdAt),
      ).length;

      const vehiclesSoldThisMonth = txs.filter((t) => isCountedSale(t) && inMonth(t.createdAt)).length;

      const totalRevenue = txs.filter(isCountedSale).reduce((s, t) => s + t.amount, 0);

      const maintenanceCosts = maintRows.reduce((s: number, r: { cost: number }) => s + r.cost, 0);

      const contractTxIds = await this.dashboardRepository.listContractTransactionIds(tenantId);
      let activeContracts = 0;
      if (contractTxIds.length > 0) {
        activeContracts = await this.dashboardRepository.countTransactionsMatching(
          contractTxIds,
          vids,
        );
      }

      const paidSales = txs.filter(isCountedSale);
      const averageSalePrice =
        paidSales.length > 0
          ? paidSales.reduce((s, t) => s + t.amount, 0) / paidSales.length
          : 0;

      const purchases = txs.filter((t) => t.type === TransactionType.PURCHASE);
      const averagePurchasePrice =
        purchases.length > 0
          ? purchases.reduce((s, t) => s + t.amount, 0) / purchases.length
          : 0;

      const monthlyProfit = monthlyRevenue - monthlyExpenses;
      const profitMargin =
        monthlyRevenue > 0 ? ((monthlyRevenue - monthlyExpenses) / monthlyRevenue) * 100 : 0;

      const topSoldModel = buildTopSoldModel(txs, vehiclesBrief, isCountedSale);
      const revenueLast6Months = buildRevenueLast6Months(txs, isCountedSale, now);

      return {
        totalVehicles,
        availableVehicles,
        soldVehicles,
        maintenanceVehicles,
        totalClients,
        monthlySales: monthlySalesCount,
        totalRevenue,
        maintenanceCosts,
        activeContracts,
        monthlyRevenue,
        monthlyExpenses,
        monthlyProfit,
        vehiclesPurchasedThisMonth,
        vehiclesSoldThisMonth,
        averageSalePrice,
        averagePurchasePrice,
        profitMargin,
        subscriptions: totalClients,
        sales: monthlySalesCount,
        activeNow: availableVehicles,
        topSoldModel,
        revenueLast6Months,
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas do dashboard:', error);
      const fallbackNow = new Date();
      return {
        totalVehicles: 0,
        availableVehicles: 0,
        soldVehicles: 0,
        maintenanceVehicles: 0,
        totalClients: 0,
        monthlySales: 0,
        totalRevenue: 0,
        maintenanceCosts: 0,
        activeContracts: 0,
        monthlyRevenue: 0,
        monthlyExpenses: 0,
        monthlyProfit: 0,
        vehiclesPurchasedThisMonth: 0,
        vehiclesSoldThisMonth: 0,
        averageSalePrice: 0,
        averagePurchasePrice: 0,
        profitMargin: 0,
        subscriptions: 0,
        sales: 0,
        activeNow: 0,
        topSoldModel: null,
        revenueLast6Months: buildRevenueLast6Months([], () => false, fallbackNow),
      };
    }
  }
}
