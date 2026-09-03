import type { Request, Response } from "express";

export function apiNotFound(_req: Request, res: Response) {
  return res.status(404).json({ message: "Endpoint não encontrado." });
}
