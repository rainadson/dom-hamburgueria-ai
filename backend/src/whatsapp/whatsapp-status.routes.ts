import { Router } from "express";

// Este endpoint descreve capacidades implementadas, não infere conexão por tokens.
// Só alterar os estados depois de implementar e verificar o transporte Meta.
export const whatsappStatus = () => ({
  connection: "not_connected",
  receiving: false,
  sending: false,
  media: false,
  humanReplies: false,
  catalogImage: "https://dom-hamburgueria-ai.vercel.app/cardapio-dom-2026-09.png",
});
const router = Router();
router.get("/status", (_req,res)=>res.json(whatsappStatus()));
export default router;
