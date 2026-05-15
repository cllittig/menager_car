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
  subscriptions: number;
  sales: number;
  activeNow: number;
  topSoldModel: DashboardTopSoldModel | null;
  revenueLast6Months: DashboardMonthRevenue[];
}
