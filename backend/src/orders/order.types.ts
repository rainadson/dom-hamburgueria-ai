export interface OrderItem {
  product: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: number;
  conversation_id: number;
  status: string;
  items: OrderItem[];
  total: number;
}