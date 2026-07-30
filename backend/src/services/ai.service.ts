import Groq from "groq-sdk";
import { SYSTEM_PROMPT } from "../prompts/system.prompt";
import { OrderService } from "../orders/order.service";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const orderService = new OrderService();

export class AIService {
  async generateResponse(message: string) {

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    const content = completion.choices[0].message.content;

    try {

      const result = JSON.parse(content || "{}");

      if (result.items) {
        result.order = await orderService.calculate(result.items);
      }

      return result;

    } catch {

      return {
        intent: "ERROR",
        reply: content,
        items: [],
      };

    }

  }
}