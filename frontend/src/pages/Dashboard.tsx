import { useEffect, useState } from "react";
import { dashboardService } from "../services/dashboard.service";
import "../styles/dashboard.css";

interface DashboardData {
  totalOrders: number;
  totalProducts: number;
  pendingOrders: number;
  totalRevenue: number;
}

export default function Dashboard() {

  const [data, setData] = useState<DashboardData>({
    totalOrders: 0,
    totalProducts: 0,
    pendingOrders: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const response = await dashboardService.getDashboard();
      setData(response);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="dashboard-container">

      <h1>📊 Dashboard</h1>

      <div className="cards">

        <div className="card">
          <h3>Pedidos</h3>
          <h2>{data.totalOrders}</h2>
        </div>

        <div className="card">
          <h3>Produtos</h3>
          <h2>{data.totalProducts}</h2>
        </div>

        <div className="card">
          <h3>Pendentes</h3>
          <h2>{data.pendingOrders}</h2>
        </div>

        <div className="card">
          <h3>Faturamento</h3>
          <h2>€ {data.totalRevenue.toFixed(2)}</h2>
        </div>

      </div>

    </div>
  );
}