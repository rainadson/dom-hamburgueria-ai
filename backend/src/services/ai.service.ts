import Groq from "groq-sdk";
import { InvalidToppingsError } from "../products/acai-toppings";
import { buildConversationContext, ConversationContext } from "../conversation/conversation.context";
import { buildSystemPrompt } from "../prompts/system.prompt";
import { OrderService } from "../orders/order.service";
import { ProductService } from "../products/product.service";
import { SettingsService } from "../settings/settings.service";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const orderService = new OrderService();
export class AIService {
  private productService: ProductService;
  private settingsService?: SettingsService;
  constructor(storeId?: string) { this.productService = new ProductService(storeId); if(storeId)this.settingsService=new SettingsService(storeId); }

  async generateResponse(
    message: string,
    history: any[] = [],
    context?: ConversationContext
  ) {

    // Busca o cardápio atual
    const menu = await this.productService.getMenuPrompt();
    const settings = this.settingsService ? await this.settingsService.get() : undefined;

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      temperature: 0,

      messages: [
        {
          role: "system",
          content: buildSystemPrompt(menu, settings) + (context ? buildConversationContext(context, history) : ""),
        },

        ...history.filter(entry => ["user", "assistant"].includes(entry.role))
          .map(entry => ({ role: entry.role, content: entry.content })),

        {
          role: "user",
          content: message,
        },
      ],
    });

    const content =
      completion.choices[0].message.content;

    try {

      const result =
        JSON.parse(content || "{}");

      if (result.items) {

        result.order =
          await orderService.calculate(
            result.items
          );

      }

      return result;

    } catch (error) {
      if (error instanceof InvalidToppingsError) {
        return { intent: "QUESTION", reply: error.message, items: [] };
      }

      return {
        intent: "ERROR",
        reply: settings?.ai_unknown_reply || "Não consegui interpretar a resposta. Tente novamente.",
        items: [],
      };

    }
  }
}
