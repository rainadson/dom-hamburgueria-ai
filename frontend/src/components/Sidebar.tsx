import { NavLink } from "react-router-dom";
import "../styles/sidebar.css";

interface SidebarProps {
  collapsed: boolean;
}

export default function Sidebar({ collapsed }: SidebarProps) {
  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>

      <div className="sidebar-logo">
        <h2>
          Tas {!collapsed && <span>AI</span>}
        </h2>

        {!collapsed && (
          <small>Restaurant OS</small>
        )}
      </div>

      <nav>

        <NavLink to="/dashboard">
          <span className="icon">📊</span>

          {!collapsed && <span>Dashboard</span>}
        </NavLink>

        <NavLink to="/orders">
          <span className="icon">📦</span>

          {!collapsed && <span>Orders</span>}
        </NavLink>

        <NavLink to="/products">
          <span className="icon">🍔</span>

          {!collapsed && <span>Products</span>}
        </NavLink>

        <NavLink to="/kitchen">
          <span className="icon">👨‍🍳</span>

          {!collapsed && <span>Kitchen</span>}
        </NavLink>

        <NavLink to="/settings">
          <span className="icon">⚙️</span>

          {!collapsed && <span>Settings</span>}
        </NavLink>

      </nav>

    </aside>
  );
}