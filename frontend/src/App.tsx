import { Routes, Route, Navigate } from "react-router-dom";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Orders from "./pages/Orders";
import Kitchen from "./pages/Kitchen";
import Conversations from "./pages/Conversations";
import ManualOrder from "./pages/ManualOrder";
import Demo from "./pages/Demo";

export default function App() {
  return (
    <Routes>

      {/* Página pública */}
      <Route path="/login" element={<Login />} />

      {/* Redirecionamento inicial */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Rotas protegidas */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/orders/new" element={<ManualOrder />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/kitchen" element={<Kitchen />} />
        <Route path="/conversations" element={<Conversations />} />
        <Route path="/demo" element={<Demo />} />
      </Route>

      {/* Qualquer rota inexistente */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />

    </Routes>
  );
}