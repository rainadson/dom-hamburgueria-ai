import { Router } from "express";
import { supabase } from "../database/supabase";
import { requireRole } from "../middlewares/auth.middleware";
import { randomUUID } from "node:crypto";

const router = Router();

router.get("/", requireRole("ADMIN"), async (_req, res) => {
  const { data, error } = await supabase
    .from("stores")
    .select("id,slug,name,active")
    .eq("active", true)
    .order("name", { ascending: true });

  if (error) return res.status(500).json({ message: "Não foi possível carregar as lojas." });
  return res.json(data || []);
});

router.post("/", requireRole("ADMIN"), async (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim().replace(/\s+/g, " ") : "";
  if (name.length < 2 || name.length > 100) {
    return res.status(400).json({ message: "Informe um nome de loja entre 2 e 100 caracteres." });
  }
  const slug = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (!slug) return res.status(400).json({ message: "Informe um nome de loja válido." });

  const { data, error } = await supabase.from("stores")
    .insert({ id: randomUUID(), name, slug, active: true })
    .select("id,slug,name,active").single();

  if (error?.code === "23505") return res.status(409).json({ message: "Já existe uma loja com esse nome." });
  if (error || !data) return res.status(500).json({ message: "Não foi possível criar a loja." });
  return res.status(201).json(data);
});

export default router;
