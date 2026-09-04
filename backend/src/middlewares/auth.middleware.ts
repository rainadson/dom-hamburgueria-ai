import type { NextFunction, Request, Response } from "express";
import { supabase } from "../database/supabase";
import { validStoreId } from "../database/store-context";

export type UserRole = "ADMIN" | "LOJA";

export interface AuthenticatedUser {
  id: string;
  email?: string;
  role: UserRole;
  storeId: string;
  profileId?: number;
  name?: string;
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
    .select("id,name,role,store_id")
    .eq("user_id", userData.user.id)
    .single();

  if (profileError || (profile?.role !== "ADMIN" && profile?.role !== "LOJA") || !validStoreId(profile?.store_id)) {
    return res.status(403).json({ message: "Usuário não autorizado para o painel." });
  }

  const requestedStoreId = req.header("x-store-id")?.trim();
  let storeId = profile.store_id;

  if (requestedStoreId) {
    if (!validStoreId(requestedStoreId)) {
      return res.status(400).json({ message: "Loja selecionada inválida." });
    }
    if (profile.role !== "ADMIN" && requestedStoreId !== profile.store_id) {
      return res.status(403).json({ message: "Seu perfil não pode acessar esta loja." });
    }
    if (profile.role === "ADMIN") {
      const { data: store, error: storeError } = await supabase
        .from("stores")
        .select("id")
        .eq("id", requestedStoreId)
        .eq("active", true)
        .maybeSingle();
      if (storeError || !store) {
        return res.status(403).json({ message: "Loja indisponível para este administrador." });
      }
      storeId = requestedStoreId;
    }
  }

  req.auth = {
    id: userData.user.id,
    email: userData.user.email,
    role: profile.role,
    storeId,
    profileId: profile.id,
    name: profile.name,
  };

  next();
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) return res.status(401).json({message:"Autenticação necessária."});
    if (!roles.includes(req.auth.role)) return res.status(403).json({message:"Seu perfil não pode realizar esta operação."});
    next();
  };
}
