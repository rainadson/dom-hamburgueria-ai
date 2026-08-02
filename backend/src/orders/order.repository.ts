import { supabase } from "../database/supabase";

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
    total: number;
    items: any[];
  }) {

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        total: data.total,
        items: data.items,
        status: "PENDING",
      })
      .select()
      .single();

    if (error) throw error;

    return order;
  }
  async updateStatus(id: number, status: string) {

    const { data, error } = await supabase
      .from("orders")
      .update({
        status
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return data;
  }
  async findAll() {

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data;

  }
}