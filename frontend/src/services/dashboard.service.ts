import { api } from "./api";

export interface DashboardData {
  totalOrders: number;
  totalProducts: number;
  pendingOrders: number;
  totalRevenue?: number;
}

export const dashboardService = {

  async getDashboard() {

    const { data } = await api.get<DashboardData>("/dashboard");

    return data;

  }

};
