import { NavLink, useNavigate } from "react-router-dom";
import "../styles/sidebar.css";
import { authService } from "../services/auth.service";

interface SidebarProps {
  collapsed: boolean;
}

export default function Sidebar({ collapsed }: SidebarProps) {
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await authService.logout();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  }

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>

      <div className="sidebar-logo">

        <h2>
          Dom <span>AI</span>
        </h2>

        {!collapsed && (
          <small>Dom Hamburgueria</small>
        )}

      </div>

      <nav className="sidebar-nav">

        <NavLink to="/dashboard">
          <span className="icon">▦</span>
          {!collapsed && <span>Dashboard</span>}
        </NavLink>

        <NavLink to="/orders">
          <span className="icon">📦</span>
          {!collapsed && <span>Pedidos</span>}
        </NavLink>

        <NavLink to="/products">
          <span className="icon">🍔</span>
          {!collapsed && <span>Produtos</span>}
        </NavLink>

        <NavLink to="/kitchen">
          <span className="icon">👨‍🍳</span>
          {!collapsed && <span>Cozinha</span>}
        </NavLink>

        <NavLink to="/clients" className="future-link">
          <span className="icon">👥</span>
          {!collapsed && <span>Clientes</span>}
        </NavLink>

        <NavLink to="/whatsapp" className="future-link">
          <span className="icon">◉</span>
          {!collapsed && <span>WhatsApp</span>}
        </NavLink>

        <NavLink to="/reports" className="future-link">
          <span className="icon">▮</span>
          {!collapsed && <span>Relatórios</span>}
        </NavLink>

        <NavLink to="/settings" className="future-link">
          <span className="icon">⚙</span>
          {!collapsed && <span>Configurações</span>}
        </NavLink>

      </nav>

      <div className="sidebar-bottom">

        <button
          className="logout-button"
          onClick={handleLogout}
          type="button"
        >
          <span className="icon">↪</span>

          {!collapsed && (
            <span>Sair</span>
          )}
        </button>

      </div>

    </aside>
  );
}