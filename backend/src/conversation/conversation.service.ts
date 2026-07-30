import { ConversationRepository } from "./conversation.repository";
import { AIService } from "../services/ai.service";
import { OrderService } from "../orders/order.service";

export class ConversationService {

  private repository = new ConversationRepository();
  private aiService = new AIService();
  private orderService = new OrderService();

  async getOrCreate(phone: string) {

    let conversation = await this.repository.findByPhone(phone);

    if (!conversation) {
      conversation = await this.repository.create(phone);
    }

    return conversation;
  }

  async processMessage(phone: string, message: string) {

    const conversation = await this.getOrCreate(phone);

    const aiResult = await this.aiService.generateResponse(message);

    if (aiResult.intent === "ADD_ITEMS") {
      const order = await this.orderService.calculate(aiResult.items);
      aiResult.order = order;

      const savedOrder = await this.orderService.saveOrder(
        phone,
        order
     );

      aiResult.savedOrder = savedOrder;
    }

    return {
      conversation,
      ai: aiResult,
    };
  }
}