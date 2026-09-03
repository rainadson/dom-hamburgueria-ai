import { validChatInput } from "../conversation/chat-input";
import { Router } from "express";
import { ConversationService } from "../conversation/conversation.service";

const router = Router();

const conversationService = new ConversationService();

router.post("/webhook", async (req, res) => {
  if (!validChatInput(req.body)) {
    return res.status(400).json({
      success: false,
      message: "Informe telefone (até 20 caracteres) e mensagem (até 4000 caracteres)."
    });
  }

  const { phone, message } = req.body;
  const conversation = await conversationService.getOrCreate(phone);

  return res.json({
    success: true,
    conversation,
    received_message: message
  });
});

export default router;