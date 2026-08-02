export enum ConversationState {
  GREETING = "GREETING",
  WAITING_ORDER = "WAITING_ORDER",
  UPSELL = "UPSELL",
  DELIVERY_TYPE = "DELIVERY_TYPE",
  ADDRESS = "ADDRESS",
  PAYMENT = "PAYMENT",
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