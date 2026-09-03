import { validChatInput } from "../conversation/chat-input";
import { Router } from "express";
import { ConversationService } from "../conversation/conversation.service";

const router = Router();
router.post("/chat", async (req, res) => {

  try {

    if (!validChatInput(req.body)) return res.status(400).json({message:"Informe telefone (até 20 caracteres) e mensagem (até 4000 caracteres)."});
    const { phone, message } = req.body;

    const response = await new ConversationService(req.auth?.storeId).processMessage(
      phone,
      message
    );

    res.json(response);

  } catch (error: any) {

    console.error("Falha ao processar mensagem no chat.");

    res.status(500).json({
      message: "Não foi possível processar a mensagem. Verifique a conversa antes de tentar novamente.",
    });

  }

});

export default router;
