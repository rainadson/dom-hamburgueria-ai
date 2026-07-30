import { Router } from "express";
import { ConversationService } from "../conversation/conversation.service";

const router = Router();

const conversationService = new ConversationService();

router.post("/webhook", async (req, res) => {
  const { phone, message } = req.body;

  if (!phone || !message) {
    return res.status(400).json({
      success: false,
      message: "Telefone e mensagem são obrigatórios."
    });
  }

  const conversation = await conversationService.getOrCreate(phone);

  return res.json({
    success: true,
    conversation,
    received_message: message
  });
});

export default router;