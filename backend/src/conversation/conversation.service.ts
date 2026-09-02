import { menuBase, menuDrink, pendingMenu, menuDrinkQuestion } from "../products/menu-combos";
import { normalizeShortReply } from "./conversation.context";
import { ConversationRepository } from "./conversation.repository";
import { ConversationState } from "./conversation.types";
import { AIService } from "../services/ai.service";
import { OrderService } from "../orders/order.service";

export class ConversationService {

  private repository = new ConversationRepository();
  private aiService = new AIService();
  private orderService = new OrderService();

  // ==========================================
  // BUSCAR OU CRIAR CONVERSA
  // ==========================================

  async getOrCreate(phone: string) {

    let conversation =
      await this.repository.findByPhone(phone);

    if (!conversation) {
      conversation =
        await this.repository.create(phone);
    }

    return conversation;
  }

  // ==========================================
  // PROCESSAR MENSAGEM
  // ==========================================

  async processMessage(
    phone: string,
    message: string
  ) {

    const conversation =
      await this.getOrCreate(phone);

    const normalizedMessage =
      message
        .toLowerCase()
        .trim();

    // Cancelar é um comando do rascunho, inclusive durante nome, morada e bebida.
    if (this.isCancellation(normalizeShortReply(message)) &&
        (conversation.order_draft?.items?.length || conversation.order_draft?.checkout_step)) {
      await this.repository.updateDraft(conversation.id, {});
      await this.repository.updateState(conversation.id, ConversationState.CANCELLED);
      const reply = "Tudo bem! O pedido foi cancelado. 😊";
      await this.saveHistory(conversation, message, reply);
      return this.response(reply);
    }

    // Recusar uma confirmação não autoriza criar nem apagar o pedido.
    if (conversation.state === ConversationState.CONFIRMATION && this.isNegative(message)) {
      const reply = "O pedido ainda não foi confirmado. Para cancelar, diga Cancelar. Para confirmar os dados apresentados, diga Sim.";
      await this.saveHistory(conversation, message, reply);
      return this.response(reply);
    }

    if (pendingMenu(conversation.order_draft?.items)) {
      if (this.isFinishedAdding(normalizedMessage)) {
        const reply = menuDrinkQuestion(conversation.order_draft.items);
        await this.saveHistory(conversation, message, reply);
        return this.response(reply, { intent: "MENU_DRINK" });
      }
      const history = conversation.history || [];
      const ai = await this.aiService.generateResponse(message, history,
        { state: ConversationState.MENU_DRINK, order_draft: conversation.order_draft });
      const choices = (ai.items || []).map((item: any) => menuDrink(item.drink || item.product)).filter(Boolean);
      const choice = choices.length > 0 && new Set(choices).size === 1 ? choices[0] : undefined;
      // Encerramento e recusas nunca escolhem uma bebida por conta própria.
      if (!choice || this.isFinishedAdding(normalizedMessage)) {
        const reply = menuDrinkQuestion(conversation.order_draft.items);
        await this.saveHistory(conversation, message, reply);
        return this.response(reply, { intent: "MENU_DRINK" });
      }
      let assigned = false;
      const items = conversation.order_draft.items.map((item: any) => {
        if (!assigned && menuBase(item.product) && !menuDrink(item.drink)) {
          assigned = true;
          return { ...item, drink: choice };
        }
        return item;
      });
      const order = await this.orderService.calculate(items);
      await this.repository.updateDraft(conversation.id, order);
      const nextPending = pendingMenu(order.items);
      await this.repository.updateState(conversation.id, nextPending ? ConversationState.MENU_DRINK : ConversationState.CONFIRMATION);
      const reply = nextPending ? menuDrinkQuestion(order.items) : this.buildOrderConfirmation(order);
      await this.saveHistory(conversation, message, reply);
      return this.response(reply, { intent: nextPending ? "MENU_DRINK" : "CONFIRMATION", order });
    }

    // ==========================================
    // 1. CHECKOUT — NOME
    // ==========================================

    if (
      conversation.state ===
        ConversationState.WAITING_ORDER &&
      conversation.order_draft?.checkout_step ===
        "NAME"
    ) {

      const name = message.trim();

      await this.updateDraft(
        conversation,
        {
          customer_name: name,
          checkout_step: "DELIVERY_TYPE"
        }
      );

      await this.repository.updateState(
        conversation.id,
        ConversationState.DELIVERY_TYPE
      );

      const reply =
        `Prazer, ${name}! 😊\n\n` +
        "Você deseja receber o pedido por:\n\n" +
        "🚚 Entrega\n" +
        "🏪 Levantamento";

      await this.saveHistory(
        conversation,
        message,
        reply
      );

      return this.response(reply);
    }

    // ==========================================
    // 2. TIPO DE ENTREGA
    // ==========================================

    if (
      conversation.state ===
      ConversationState.DELIVERY_TYPE
    ) {

      // --------------------------
      // ENTREGA
      // --------------------------

      if (
        this.isDelivery(normalizedMessage)
      ) {

        await this.updateDraft(
          conversation,
          {
            delivery_type: "DELIVERY",
            checkout_step: "ADDRESS"
          }
        );

        await this.repository.updateState(
          conversation.id,
          ConversationState.ADDRESS
        );

        const reply =
          "Perfeito! 🚚\n\n" +
          "Qual é a morada para entrega?";

        await this.saveHistory(
          conversation,
          message,
          reply
        );

        return this.response(reply);
      }

      // --------------------------
      // LEVANTAMENTO
      // --------------------------

      if (
        this.isPickup(normalizedMessage)
      ) {

        await this.updateDraft(
          conversation,
          {
            delivery_type: "PICKUP",
            address: null,
            checkout_step: "PAYMENT"
          }
        );

        await this.repository.updateState(
          conversation.id,
          ConversationState.PAYMENT
        );

        const reply =
          "Perfeito! 🏪\n\n" +
          "Como deseja pagar?\n\n" +
          "💶 Dinheiro\n" +
          "💳 Multibanco";

        await this.saveHistory(
          conversation,
          message,
          reply
        );

        return this.response(reply);
      }

      const reply =
        "Por favor, escolha uma das opções:\n\n" +
        "🚚 Entrega\n" +
        "🏪 Levantamento";

      await this.saveHistory(
        conversation,
        message,
        reply
      );

      return this.response(reply);
    }

    // ==========================================
    // 3. MORADA
    // ==========================================

    if (
      conversation.state ===
      ConversationState.ADDRESS
    ) {

      const address = message.trim();

      await this.updateDraft(
        conversation,
        {
          address,
          checkout_step: "PAYMENT"
        }
      );

      await this.repository.updateState(
        conversation.id,
        ConversationState.PAYMENT
      );

      const reply =
        "Morada registrada! 📍\n\n" +
        "Como deseja pagar?\n\n" +
        "💶 Dinheiro\n" +
        "💳 Multibanco";

      await this.saveHistory(
        conversation,
        message,
        reply
      );

      return this.response(reply);
    }

    // ==========================================
    // 4. PAGAMENTO
    // ==========================================

    if (
      conversation.state ===
      ConversationState.PAYMENT
    ) {

      // --------------------------
      // DINHEIRO
      // --------------------------

      if (
        this.isCash(normalizedMessage)
      ) {

        const total =
          Number(
            conversation.order_draft?.total || 0
          );

        await this.updateDraft(
          conversation,
          {
            payment_method: "DINHEIRO",
            checkout_step: "CASH_AMOUNT"
          }
        );

        await this.repository.updateState(
          conversation.id,
          ConversationState.CASH_AMOUNT
        );

        const reply =
          "Perfeito! 💶\n\n" +
          `O seu pedido totaliza € ${total.toFixed(2)}.\n\n` +
          "Quanto vai entregar em dinheiro?";

        await this.saveHistory(
          conversation,
          message,
          reply
        );

        return this.response(reply);
      }

      // --------------------------
      // MULTIBANCO
      // --------------------------

      if (
        this.isCard(normalizedMessage)
      ) {

        const draft = {
          ...conversation.order_draft,
          payment_method: "MULTIBANCO",
          amount_paid: null,
          change: 0,
          checkout_step: "FINAL_REVIEW"
        };

        await this.repository.updateDraft(
          conversation.id,
          draft
        );

        await this.repository.updateState(
          conversation.id,
          ConversationState.CONFIRMATION
        );

        const reply =
          this.buildFinalConfirmation(draft);

        await this.saveHistory(
          conversation,
          message,
          reply
        );

        return this.response(
          reply,
          {
            intent: "FINAL_CONFIRMATION",
            order: draft
          }
        );
      }

      const reply =
        "Por favor, escolha uma forma de pagamento:\n\n" +
        "💶 Dinheiro\n" +
        "💳 Multibanco";

      await this.saveHistory(
        conversation,
        message,
        reply
      );

      return this.response(reply);
    }

    // ==========================================
    // 5. VALOR ENTREGUE EM DINHEIRO
    // ==========================================

    if (
      conversation.state ===
      ConversationState.CASH_AMOUNT
    ) {

      const amountPaid =
        this.parseMoney(message);

      const total =
        Number(
          conversation.order_draft?.total || 0
        );

      // --------------------------
      // VALOR INVÁLIDO
      // --------------------------

      if (
        amountPaid === null ||
        amountPaid <= 0
      ) {

        const reply =
          "Não consegui identificar o valor.\n\n" +
          "Por favor, informe quanto vai entregar.\n\n" +
          "Exemplo: 50";

        await this.saveHistory(
          conversation,
          message,
          reply
        );

        return this.response(reply);
      }

      // --------------------------
      // VALOR INSUFICIENTE
      // --------------------------

      if (
        amountPaid < total
      ) {

        const reply =
          `O valor informado é insuficiente.\n\n` +
          `💶 Total: € ${total.toFixed(2)}\n` +
          `💰 Valor informado: € ${amountPaid.toFixed(2)}\n\n` +
          "Por favor, informe um valor igual ou superior ao total.";

        await this.saveHistory(
          conversation,
          message,
          reply
        );

        return this.response(reply);
      }

      // --------------------------
      // CALCULAR TROCO
      // --------------------------

      const change =
        Number(
          (amountPaid - total).toFixed(2)
        );

      const draft = {
        ...conversation.order_draft,
        payment_method: "DINHEIRO",
        amount_paid: amountPaid,
        change,
        checkout_step: "FINAL_REVIEW"
      };

      await this.repository.updateDraft(
        conversation.id,
        draft
      );

      await this.repository.updateState(
        conversation.id,
        ConversationState.CONFIRMATION
      );

      const reply =
        this.buildFinalConfirmation(draft);

      await this.saveHistory(
        conversation,
        message,
        reply
      );

      return this.response(
        reply,
        {
          intent: "FINAL_CONFIRMATION",
          order: draft
        }
      );
    }

    // ==========================================
    // 6. CONFIRMAÇÃO FINAL DO CHECKOUT
    // ==========================================

    if (
      conversation.state ===
      ConversationState.CONFIRMATION &&
      conversation.order_draft?.checkout_step ===
      "FINAL_REVIEW"
    ) {

      // --------------------------
      // CONFIRMAR
      // --------------------------

      if (
        this.isConfirmation(
          normalizedMessage
        )
      ) {

        const savedOrder =
          await this.orderService.saveOrder(
            phone,
            conversation.order_draft
          );

        await this.repository.updateDraft(
          conversation.id,
          {}
        );

        await this.repository.updateState(
          conversation.id,
          ConversationState.FINISHED
        );

        const reply =
          "Pedido confirmado! ✅\n\n" +
          "Seu pedido foi enviado para a cozinha " +
          "e já está sendo preparado. 🍔";

        await this.saveHistory(
          conversation,
          message,
          reply
        );

        return {
          conversation,
          ai: {
            intent: "CONFIRMED",
            reply,
            savedOrder
          }
        };
      }

      // --------------------------
      // CANCELAR
      // --------------------------

      if (
        this.isCancellation(
          normalizedMessage
        )
      ) {

        await this.repository.updateDraft(
          conversation.id,
          {}
        );

        await this.repository.updateState(
          conversation.id,
          ConversationState.CANCELLED
        );

        const reply =
          "Tudo bem! O pedido foi cancelado. 😊";

        await this.saveHistory(
          conversation,
          message,
          reply
        );

        return this.response(reply);
      }

      const reply =
        "Por favor, responda:\n\n" +
        "✅ Sim\n" +
        "❌ Cancelar";

      await this.saveHistory(
        conversation,
        message,
        reply
      );

      return this.response(reply);
    }

    // ==========================================
    // 7. PRIMEIRA CONFIRMAÇÃO DO PEDIDO
    // ==========================================
    //
    // Aqui acontece:
    //
    // Resumo
    // ↓
    // Cliente: SIM
    // ↓
    // Perguntar nome
    //
    // ==========================================

    if (
      conversation.state ===
      ConversationState.CONFIRMATION &&
      !conversation.order_draft?.checkout_step &&
      this.isConfirmation(
        normalizedMessage
      )
    ) {

      const draft = {
        ...conversation.order_draft,
        checkout_step: "NAME"
      };

      await this.repository.updateDraft(
        conversation.id,
        draft
      );

      // IMPORTANTE:
      // Agora mudamos para WAITING_ORDER
      // para que a próxima mensagem
      // seja interpretada como o nome.

      await this.repository.updateState(
        conversation.id,
        ConversationState.WAITING_ORDER
      );

      const reply =
        "Perfeito! 😊\n\n" +
        "Antes de finalizar, qual é o seu nome?";

      await this.saveHistory(
        conversation,
        message,
        reply
      );

      return this.response(reply);
    }

    // ==========================================
    // 8. CANCELAMENTO NA CONFIRMAÇÃO
    // ==========================================

    if (
      conversation.state ===
      ConversationState.CONFIRMATION &&
      this.isCancellation(
        normalizedMessage
      )
    ) {

      await this.repository.updateDraft(
        conversation.id,
        {}
      );

      await this.repository.updateState(
        conversation.id,
        ConversationState.CANCELLED
      );

      const reply =
        "Tudo bem! O pedido foi cancelado. 😊";

      await this.saveHistory(
        conversation,
        message,
        reply
      );

      return this.response(reply);
    }

    // ==========================================
    // ENCERRAMENTO DOS ADICIONAIS — ANTES DE OFERTAS E ESCOLHAS
    // ==========================================

    if (
      !conversation.order_draft?.checkout_step &&
      (
        conversation.state === ConversationState.UPSELL ||
        (
          (conversation.state === ConversationState.MENU_OFFER ||
            conversation.state === ConversationState.MENU_DRINK) &&
          this.isExplicitlyFinishedAdding(normalizedMessage)
        )
      )
    ) {

      // --------------------------
      // CLIENTE NÃO QUER MAIS
      // --------------------------

      if (
        this.isFinishedAdding(
          normalizedMessage
        )
      ) {

        const order =
          await this.orderService.calculate(
            conversation.order_draft?.items || []
          );

        await this.repository.updateDraft(
          conversation.id,
          order
        );

        await this.repository.updateState(
          conversation.id,
          ConversationState.CONFIRMATION
        );

        const reply =
          this.buildOrderConfirmation(
            order
          );

        await this.saveHistory(
          conversation,
          message,
          reply
        );

        return this.response(
          reply,
          {
            intent: "CONFIRMATION",
            order
          }
        );
      }
    }

    // ==========================================
    // 10. MENU RECUSADO
    // ==========================================

    if (
      conversation.state ===
      ConversationState.MENU_OFFER &&
      this.isNegative(
        normalizedMessage
      )
    ) {

      await this.repository.updateState(
        conversation.id,
        ConversationState.UPSELL
      );

      const reply =
        "Tudo bem! Deseja acrescentar mais alguma coisa ao seu pedido?";

      await this.saveHistory(
        conversation,
        message,
        reply
      );

      return this.response(
        reply,
        {
          intent: "UPSELL",
          order: conversation.order_draft
        }
      );
    }

    // ==========================================
    // 13. IA
    // ==========================================

    const aiResult =
      await this.aiService.generateResponse(
        message,
        conversation.history || [],
        { state: conversation.state, order_draft: conversation.order_draft }
      );

    if (aiResult.intent === "MENU_ACCEPTED") {
      const order = await this.orderService.upgradeMenus(conversation.order_draft?.items || [], aiResult.items || []);
      if (!order) {
        const reply = "Qual hambúrguer do seu pedido deseja transformar em Menu?";
        await this.saveHistory(conversation, message, reply);
        return this.response(reply, { intent: "QUESTION" });
      }
      await this.repository.updateDraft(conversation.id, order);
      const pending = pendingMenu(order.items);
      await this.repository.updateState(conversation.id, pending ? ConversationState.MENU_DRINK : ConversationState.CONFIRMATION);
      const reply = pending ? menuDrinkQuestion(order.items) : this.buildOrderConfirmation(order);
      await this.saveHistory(conversation, message, reply);
      return this.response(reply, { intent: pending ? "MENU_DRINK" : "CONFIRMATION", order });
    }

    // ==========================================
    // 15. PEDIDO / ADIÇÃO DE PRODUTO
    // ==========================================

    if (
      (aiResult.intent === "ORDER" || aiResult.intent === "MENU_OFFER")
    ) {

      const currentItems =
        conversation.order_draft?.items || [];

      const newItems =
        aiResult.items || [];

      const order =
        await this.orderService.calculate([
          ...currentItems,
          ...newItems
        ]);

      await this.repository.updateDraft(
        conversation.id,
        order
      );

      if (pendingMenu(order.items)) {
        await this.repository.updateState(conversation.id, ConversationState.MENU_DRINK);
        const reply = menuDrinkQuestion(order.items);
        await this.saveHistory(conversation, message, reply);
        return this.response(reply, { intent: "MENU_DRINK", order });
      }

      // ========================================
      // DETECTAR OFERTA DE MENU
      // ========================================

      const declinesMenu = /\b(?:sem menu|nao (?:quero|desejo) (?:o |um )?menu|(?:so|somente|apenas) (?:o |os |um )?hamburguer(?:es)?)\b/.test(normalizeShortReply(message));
      const offer = declinesMenu ? null : await this.orderService.menuOffer(order.items.slice(currentItems.length));
      if (offer) {
        await this.repository.updateState(conversation.id, ConversationState.MENU_OFFER);
        await this.saveHistory(conversation, message, offer);
        return this.response(offer, { intent: "MENU_OFFER", order });
      }

      // ========================================
      // UPSELL NORMAL
      // ========================================

      await this.repository.updateState(
        conversation.id,
        ConversationState.UPSELL
      );

      const reply =
        (!declinesMenu && aiResult.intent !== "MENU_OFFER" && !/menu/i.test(aiResult.reply || "") && aiResult.reply?.includes("?") ? aiResult.reply :
          "Perfeito! Deseja acrescentar mais alguma coisa ao seu pedido?");

      await this.saveHistory(
        conversation,
        message,
        reply
      );

      return this.response(
        reply,
        {
          intent: "UPSELL",
          order
        }
      );
    }

    // ==========================================
    // 16. CONVERSA NORMAL
    // ==========================================

    const reply =
      aiResult.reply || "";

    await this.saveHistory(
      conversation,
      message,
      reply
    );

    return this.response(
      reply,
      {
        intent: aiResult.intent,
        items: aiResult.items || []
      }
    );
  }

  // ==========================================
  // ATUALIZAR PEDIDO
  // ==========================================

  private async updateDraft(
    conversation: any,
    changes: any
  ) {

    const draft = {
      ...(conversation.order_draft || {}),
      ...changes
    };

    await this.repository.updateDraft(
      conversation.id,
      draft
    );
  }

  // ==========================================
  // RESPOSTA
  // ==========================================

  private response(
    reply: string,
    extra: any = {}
  ) {

    return {
      ai: {
        reply,
        ...extra
      }
    };
  }

  // ==========================================
  // ENTREGA
  // ==========================================

  private isDelivery(
    message: string
  ): boolean {

    return [
      "entrega",
      "delivery",
      "entregar",
      "quero entrega",
      "para entregar",
      "entregar em casa",
      "quero receber"
    ].includes(message);
  }

  // ==========================================
  // LEVANTAMENTO
  // ==========================================

  private isPickup(
    message: string
  ): boolean {

    return [
      "levantamento",
      "levantar",
      "buscar",
      "busca",
      "retirar",
      "vou buscar",
      "vou levantar",
      "pickup"
    ].includes(message);
  }

  // ==========================================
  // DINHEIRO
  // ==========================================

  private isCash(
    message: string
  ): boolean {

    return [
      "dinheiro",
      "cash",
      "em dinheiro"
    ].includes(message);
  }

  // ==========================================
  // MULTIBANCO
  // ==========================================

  private isCard(
    message: string
  ): boolean {

    return [
      "multibanco",
      "cartão",
      "cartao",
      "cartão multibanco",
      "cartao multibanco"
    ].includes(message);
  }

  // ==========================================
  // POSITIVO
  // ==========================================

  private isPositive(
    message: string
  ): boolean {

    message = normalizeShortReply(message);

    return [
      "sim",
      "quero",
      "aceito",
      "pode ser",
      "beleza",
      "esse mesmo",
      "manda",
      "coloca",
      "adiciona",
      "pode colocar",
      "claro",
      "quero o menu",
      "pode",
      "isso",
      "esse",
      "essa",
      "ok",
      "okay"
    ].includes(message);
  }

  // ==========================================
  // NEGATIVO
  // ==========================================

  private isNegative(
    message: string
  ): boolean {

    message = normalizeShortReply(message);

    return [
      "não",
      "nao",
      "não quero",
      "nao quero",
      "nao precisa",
      "deixa",
      "deixa assim",
      "nao obrigado",
      "sem menu",
      "não quero menu",
      "nao quero menu"
    ].includes(message);
  }

  // ==========================================
  // FINALIZAR UPSELL
  // ==========================================

  private isExplicitlyFinishedAdding(message: string): boolean {
    return [
      "e so isso",
      "so isso",
      "isso e tudo",
      "e tudo",
      "nada mais",
      "nao quero mais",
      "deixa assim",
      "pode fechar",
      "pode finalizar",
      "pode fechar o pedido"
    ].includes(normalizeShortReply(message));
  }

  private isFinishedAdding(message: string): boolean {
    return this.isExplicitlyFinishedAdding(message) || [
      "nao",
      "nao quero",
      "nada",
      "nao precisa",
      "deixa",
      "nao obrigado"
    ].includes(normalizeShortReply(message));
  }

  // ==========================================
  // CONFIRMAÇÃO
  // ==========================================

  private isConfirmation(
    message: string
  ): boolean {

    message = normalizeShortReply(message);

    return [
      "sim",
      "sim, pode confirmar",
      "sim pode confirmar",
      "pode confirmar",
      "confirmo",
      "confirmar",
      "confirmado",
      "ok",
      "okay",
      "certo",
      "isso mesmo"
    ].includes(message);
  }

  // ==========================================
  // CANCELAMENTO
  // ==========================================

  private isCancellation(
    message: string
  ): boolean {

    return [
      "cancelar",
      "cancela",
      "desistir",
      "desisto"
    ].includes(message);
  }

  // ==========================================
  // CONVERTER VALOR MONETÁRIO
  // ==========================================

  private parseMoney(
    message: string
  ): number | null {

    const cleaned =
      message
        .replace("€", "")
        .replace(/\s/g, "")
        .replace(",", ".")
        .trim();

    const value =
      Number(cleaned);

    if (
      !Number.isFinite(value)
    ) {
      return null;
    }

    return value;
  }

  // ==========================================
  // HISTÓRICO
  // ==========================================

  private async saveHistory(
    conversation: any,
    userMessage: string,
    assistantMessage: string
  ) {

    const history =
      conversation.history || [];

    history.push({
      role: "user",
      content: userMessage
    });

    if (assistantMessage) {

      history.push({
        role: "assistant",
        content: assistantMessage
      });
    }

    await this.repository.updateHistory(
      conversation.id,
      history
    );
  }

  // ==========================================
  // RESUMO DO PEDIDO
  // ==========================================

  private buildOrderConfirmation(
    order: any
  ): string {

    let text =
      "🍔 Dom Hamburgueria\n\n";

    text +=
      "Seu pedido:\n\n";

    order.items.forEach(
      (item: any) => {

        text +=
          `• ${item.quantity}x ${item.product}\n`;
        if (item.components?.length) text += `  ${item.components.join(" + ")}\n`;


        text +=
          `€ ${Number(
            item.subtotal
          ).toFixed(2)}\n\n`;
      }
    );

    text +=
      "──────────────\n";

    text +=
      `💶 Total: € ${Number(
        order.total
      ).toFixed(2)}\n\n`;

    text +=
      "Deseja confirmar o pedido?\n\n";

    text +=
      "✅ Sim\n";

    text +=
      "❌ Cancelar";

    return text;
  }

  // ==========================================
  // RESUMO FINAL DO CHECKOUT
  // ==========================================

  private buildFinalConfirmation(
    draft: any
  ): string {

    let text =
      "🍔 Dom Hamburgueria\n\n";

    text +=
      "Confira os dados do seu pedido:\n\n";

    text +=
      `👤 Nome: ${
        draft.customer_name || "-"
      }\n`;

    text +=
      `📦 Tipo: ${
        draft.delivery_type === "DELIVERY"
          ? "Entrega"
          : "Levantamento"
      }\n`;

    if (
      draft.delivery_type ===
      "DELIVERY"
    ) {

      text +=
        `📍 Morada: ${
          draft.address || "-"
        }\n`;
    }

    text += "\n";

    text +=
      "🛒 Pedido:\n\n";

    draft.items.forEach(
      (item: any) => {

        text +=
          `• ${item.quantity}x ${item.product}\n`;
        if (item.components?.length) text += `  ${item.components.join(" + ")}\n`;


        text +=
          `€ ${Number(
            item.subtotal
          ).toFixed(2)}\n\n`;
      }
    );

    text +=
      "──────────────\n";

    text +=
      `💶 Total: € ${Number(
        draft.total
      ).toFixed(2)}\n\n`;

    text +=
      `💳 Pagamento: ${
        draft.payment_method || "-"
      }\n`;

    // --------------------------
    // DINHEIRO
    // --------------------------

    if (
      draft.payment_method ===
      "DINHEIRO"
    ) {

      text +=
        `💰 Valor entregue: € ${
          Number(
            draft.amount_paid || 0
          ).toFixed(2)
        }\n`;

      text +=
        `💵 Troco: € ${
          Number(
            draft.change || 0
          ).toFixed(2)
        }\n`;
    }

    text += "\n";

    text +=
      "Está tudo correto?\n\n";

    text +=
      "✅ Sim\n";

    text +=
      "❌ Cancelar";

    return text;
  }
}
