export enum ConversationState {
  GREETING = "GREETING",
  WAITING_ORDER = "WAITING_ORDER",
  UPSELL = "UPSELL",

  MENU_OFFER = "MENU_OFFER",
  MENU_DRINK = "MENU_DRINK",

  DELIVERY_TYPE = "DELIVERY_TYPE",
  ADDRESS = "ADDRESS",
  PAYMENT = "PAYMENT",

  CASH_AMOUNT = "CASH_AMOUNT",

  CONFIRMATION = "CONFIRMATION",
  FINISHED = "FINISHED",
  CANCELLED = "CANCELLED"
}

export interface Conversation {
  id: number;
  phone: string;
  customer_name?: string;
  state: ConversationState;
  history: any[];
  order_draft: any;
}