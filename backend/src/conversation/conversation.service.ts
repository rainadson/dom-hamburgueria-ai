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

    // Cliente confirmou o pedido
    if (
      conversation.state === "CONFIRMATION" &&
      ["sim", "ok", "confirmo", "confirmar"].includes(
        message.toLowerCase().trim()
      )
    ) {

      const savedOrder = await this.orderService.saveOrder(
        phone,
        conversation.order_draft
      );

      await this.repository.updateDraft(conversation.id, {});

      await this.repository.updateState(
        conversation.id,
        "FINISHED" as any
      );

      return {
        conversation,
        ai: {
          intent: "CONFIRMED",
          reply:
            "✅ Pedido confirmado!\n\nSeu pedido foi enviado para a cozinha e já está sendo preparado. 🍔",
          savedOrder,
        },
      };
    }

    const aiResult = await this.aiService.generateResponse(message);

    if (aiResult.intent === "ORDER") {

      const order = await this.orderService.calculate(aiResult.items);

      aiResult.order = order;

      // Salva o pedido temporariamente
      await this.repository.updateDraft(conversation.id, order);

      // Muda o estado para confirmação
      await this.repository.updateState(
        conversation.id,
        "CONFIRMATION" as any
      );

      aiResult.reply = this.buildOrderConfirmation(order);
    }

    return {
      conversation,
      ai: aiResult,
    };
  }

  private buildOrderConfirmation(order: any) {

    let text = "🍔 *Dom Hamburgueria*\n\n";

    text += "Seu pedido:\n\n";

    order.items.forEach((item: any) => {

      text += `• ${item.quantity}x ${item.product}\n`;
      text += `€ ${item.subtotal.toFixed(2)}\n\n`;

    });

    text += "──────────────\n";
    text += `💶 Total: € ${order.total.toFixed(2)}\n\n`;
    text += "Deseja confirmar o pedido?\n\n";
    text += "✅ Sim\n";
    text += "❌ Cancelar";

    return text;
  }

}