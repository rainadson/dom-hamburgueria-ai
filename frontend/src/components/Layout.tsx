import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import "../styles/layout.css";

export default function Layout() {

  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`layout ${collapsed ? "collapsed" : ""}`}>

      <Sidebar collapsed={collapsed} />

      <main className="content">

        <button
          className="toggle-sidebar"
          onClick={() => setCollapsed(!collapsed)}
        >
          ☰
        </button>

        <Outlet />

      </main>

    </div>
  );
}