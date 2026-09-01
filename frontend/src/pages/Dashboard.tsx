import { useEffect, useState } from "react";

import { dashboardService } from "../services/dashboard.service";
import { useAuth } from "../context/AuthContext";

import "../styles/dashboard.css";

interface DashboardData {
  totalOrders: number;
  totalProducts: number;
  pendingOrders: number;
  totalRevenue: number;
}

export default function Dashboard() {
  const { profile, loading: authLoading } = useAuth();

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
      const dashboard = await dashboardService.getDashboard();

      setData(dashboard);
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    }
  }

  if (authLoading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-loading">
          Carregando dashboard...
        </div>
      </div>
    );
  }

  const isAdmin = profile?.role === "ADMIN";

  return (
    <div className="dashboard-container">

      <div className="dashboard-header">

        <div>
          <h1>Dashboard</h1>

          <p>
            Visão geral do seu restaurante
          </p>
        </div>

        <button
          className="period-button"
          type="button"
        >
          Hoje <span>⌄</span>
        </button>

      </div>

      <div className="dashboard-cards">

        {/* PEDIDOS */}

        <div className="dashboard-card">

          <div className="dashboard-card-header">

            <div className="dashboard-icon orders-icon">
              📋
            </div>

            <div>

              <span className="dashboard-title">
                Pedidos
              </span>

              <span className="dashboard-subtitle">
                Total de pedidos
              </span>

            </div>

          </div>

          <div className="dashboard-value">
            {data.totalOrders}
          </div>

        </div>

        {/* FATURAMENTO — SOMENTE ADMIN */}

        {isAdmin && (

          <div className="dashboard-card">

            <div className="dashboard-card-header">

              <div className="dashboard-icon revenue-icon">
                €
              </div>

              <div>

                <span className="dashboard-title">
                  Faturamento
                </span>

                <span className="dashboard-subtitle">
                  Total em vendas
                </span>

              </div>

            </div>

            <div className="dashboard-value">
              € {data.totalRevenue.toFixed(2).replace(".", ",")}
            </div>

          </div>

        )}

        {/* PENDENTES */}

        <div className="dashboard-card">

          <div className="dashboard-card-header">

            <div className="dashboard-icon pending-icon">
              ⏳
            </div>

            <div>

              <span className="dashboard-title">
                Pendentes
              </span>

              <span className="dashboard-subtitle">
                Pedidos pendentes
              </span>

            </div>

          </div>

          <div className="dashboard-value">
            {data.pendingOrders}
          </div>

        </div>

        {/* PRODUTOS */}

        <div className="dashboard-card">

          <div className="dashboard-card-header">

            <div className="dashboard-icon products-icon">
              🍔
            </div>

            <div>

              <span className="dashboard-title">
                Produtos
              </span>

              <span className="dashboard-subtitle">
                Produtos cadastrados
              </span>

            </div>

          </div>

          <div className="dashboard-value">
            {data.totalProducts}
          </div>

        </div>

      </div>

      <div className="dashboard-sections">

        {/* PEDIDOS RECENTES */}

        <section className="dashboard-panel recent-orders">

          <div className="panel-header">

            <div>

              <h2>
                📋 Pedidos recentes
              </h2>

              <p>
                Últimos pedidos recebidos
              </p>

            </div>

            <button
              className="view-all-button"
              type="button"
            >
              Ver todos
            </button>

          </div>

          <div className="empty-panel">

            <div className="empty-icon">
              📦
            </div>

            <h3>
              Nenhum pedido ainda
            </h3>

            <p>
              Os pedidos aparecerão aqui
            </p>

          </div>

        </section>

        {/* ESTATÍSTICAS */}

        <section className="dashboard-panel statistics-panel">

          <div className="panel-header">

            <div>
              <h2>
                📈 Estatísticas rápidas
              </h2>
            </div>

            <button
              className="period-small"
              type="button"
            >
              Hoje <span>⌄</span>
            </button>

          </div>

          <div className="chart">

            <div className="chart-grid">

              <span>1,0</span>
              <span>0,8</span>
              <span>0,6</span>
              <span>0,4</span>
              <span>0,2</span>
              <span>0</span>

            </div>

            <div className="chart-area">

              <svg
                viewBox="0 0 700 220"
                preserveAspectRatio="none"
              >

                <line
                  x1="0"
                  y1="200"
                  x2="700"
                  y2="200"
                  className="chart-line"
                />

                <polyline
                  points="0,200 40,200 80,200 120,200 160,200 200,200 240,200 280,200 320,200 360,200 400,200 440,200 480,200 520,200 560,200 600,200 640,200 700,200"
                  className="chart-data"
                />

                <circle cx="0" cy="200" r="4" />
                <circle cx="80" cy="200" r="4" />
                <circle cx="160" cy="200" r="4" />
                <circle cx="240" cy="200" r="4" />
                <circle cx="320" cy="200" r="4" />
                <circle cx="400" cy="200" r="4" />
                <circle cx="480" cy="200" r="4" />
                <circle cx="560" cy="200" r="4" />
                <circle cx="640" cy="200" r="4" />
                <circle cx="700" cy="200" r="4" />

              </svg>

              <div className="chart-labels">

                <span>00h</span>
                <span>04h</span>
                <span>08h</span>
                <span>12h</span>
                <span>16h</span>
                <span>20h</span>
                <span>23h</span>

              </div>

            </div>

          </div>

        </section>

      </div>

      <footer className="dashboard-footer">

        <span>
          © 2025 Dom AI - Dom Hamburgueria
        </span>

        <span>
          Desenvolvido por AOS Tecnologia
        </span>

      </footer>

    </div>
  );
}