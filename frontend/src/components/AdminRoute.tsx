import type {ReactNode} from "react";
import {Navigate} from "react-router-dom";
import {useAuth} from "../context/AuthContext";
export default function AdminRoute({children}:{children:ReactNode}) {
  const {profile,loading}=useAuth();
  if(loading)return <h2>Carregando permissões...</h2>;
  return profile?.role === "ADMIN" ? <>{children}</> : <Navigate to="/dashboard" replace />;
}
