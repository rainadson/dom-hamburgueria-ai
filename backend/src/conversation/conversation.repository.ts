import { supabase } from "../database/supabase";
import { ConversationState } from "./conversation.types";

export class ConversationRepository {

  async findByPhone(phone: string) {
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("phone", phone)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    return data;
  }

  async create(phone: string) {
    const { data, error } = await supabase
      .from("conversations")
      .insert({
        phone,
        state: ConversationState.GREETING,
        history: [],
        order_draft: {}
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  async updateState(id: number, state: ConversationState) {
    const { error } = await supabase
      .from("conversations")
      .update({
        state,
        updated_at: new Date().toISOString()
      })
      .eq("id", id);

    if (error) throw error;
  }

  async updateDraft(id: number, draft: any) {
    const { error } = await supabase
      .from("conversations")
      .update({
        order_draft: draft,
        updated_at: new Date().toISOString()
      })
      .eq("id", id);

    if (error) throw error;
  }

}