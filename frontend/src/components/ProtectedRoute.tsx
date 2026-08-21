import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { authService } from "../services/auth.service";

interface Props {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: Props) {

  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {

    async function checkAuth() {

      const session = await authService.getSession();

      setAuthenticated(!!session);

      setLoading(false);

    }

    checkAuth();

  }, []);

  if (loading) {
    return <h2>Loading...</h2>;
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;

}