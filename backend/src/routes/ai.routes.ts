import { Router } from "express";
import { ConversationService } from "../conversation/conversation.service";

const router = Router();
const conversation = new ConversationService();

router.get("/test-ai", async (req, res) => {
  try {
    const response = await conversation.processMessage(
      "351912345678",
      "Quero dois X Burguer e uma Coca"
    );

    res.json(response);
  } catch (error: any) {
    console.error(error);

    res.status(500).json({
      message: error.message,
      error,
    });
  }
});

export default router;