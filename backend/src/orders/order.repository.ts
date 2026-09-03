import { supabase } from "../database/supabase";

export class OrderStatusError extends Error {
  constructor(public statusCode:number, message:string){super(message);}
}
const validStatuses = new Set(["PENDING", "PREPARING", "READY", "DELIVERED", "CANCELLED"]);

export class OrderRepository {

  async findOpen(conversationId: number) {

    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("conversation_id", conversationId)
      .eq("status", "OPEN")
      .single();

    return data;
  }

  async createOrder(data: {
    customer_name?: string;
    customer_phone: string;
    delivery_type?: string;
    address?: string;
    payment_method?: string;
    amount_paid?: number;
    change?: number;
    delivery_fee?: number;
    total: number;
    items: any[];
  }) {

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,

        delivery_type: data.delivery_type,
        address: data.address,

        payment_method: data.payment_method,

        // Valor entregue pelo cliente quando pagamento
        // for em dinheiro
        amount_paid: data.amount_paid,

        // Troco calculado pelo sistema
        change: data.change,

        delivery_fee: data.delivery_fee || 0,

        total: data.total,
        items: data.items,

        status: "PENDING",
      })
      .select()
      .single();

    if (error) throw error;

    return order;
  }

  async updateStatus(id: number, status: string, expectedStatus?: string) {
    if (!Number.isSafeInteger(id) || id <= 0 || !validStatuses.has(status)
      || (expectedStatus !== undefined && !validStatuses.has(expectedStatus))) {
      throw new OrderStatusError(400, "Pedido ou estado inválido.");
    }
    let query = supabase.from("orders").update({status}).eq("id", id);
    // Comparação no mesmo UPDATE: não há intervalo entre ler e gravar.
    if (expectedStatus !== undefined) query = query.eq("status", expectedStatus);
    const {data,error} = await query.select().maybeSingle();
    if (error) throw error;
    if (!data) throw new OrderStatusError(expectedStatus === undefined ? 404 : 409,
      expectedStatus === undefined ? "Pedido não encontrado." : "O pedido mudou. Atualize e confira o estado antes de tentar novamente.");
    return data;
  }

  async findAll() {

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", {
        ascending: false
      });

    if (error) throw error;

    return data;
  }
}