import type { NextFunction, Request, Response } from "express";
import { supabase } from "../database/supabase";

export type UserRole = "ADMIN" | "LOJA";

export interface AuthenticatedUser {
  id: string;
  email?: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthenticatedUser;
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authorization = req.header("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token de autenticação ausente." });
  }

  const token = authorization.slice("Bearer ".length).trim();

  if (!token) {
    return res.status(401).json({ message: "Token de autenticação inválido." });
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(token);

  if (userError || !userData.user) {
    return res.status(401).json({ message: "Token de autenticação inválido." });
  }

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("user_id", userData.user.id)
    .single();

  if (profileError || (profile?.role !== "ADMIN" && profile?.role !== "LOJA")) {
    return res.status(403).json({ message: "Usuário não autorizado para o painel." });
  }

  req.auth = {
    id: userData.user.id,
    email: userData.user.email,
    role: profile.role,
  };

  next();
}
