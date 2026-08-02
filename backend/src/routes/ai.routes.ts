import { Router } from "express";
import { ConversationService } from "../conversation/conversation.service";

const router = Router();
const conversation = new ConversationService();

router.post("/chat", async (req, res) => {

  try {

    const { phone, message } = req.body;

    const response = await conversation.processMessage(
      phone,
      message
    );

    res.json(response);

  } catch (error: any) {

    console.error(error);

    res.status(500).json({
      message: error.message,
    });

  }

});

export default router;