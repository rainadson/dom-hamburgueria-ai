import { supabase } from "../database/supabase";
import { ConversationState } from "./conversation.types";
import { DOM_STORE_ID } from "../database/store-context";

export class ConversationRepository {
  constructor(private storeId = DOM_STORE_ID) {}

  async findByPhone(phone: string) {
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("store_id", this.storeId)
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
        store_id: this.storeId,
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
      .eq("store_id", this.storeId)
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
      .eq("store_id", this.storeId)
      .eq("id", id);

    if (error) throw error;
  }

  async updateHistory(id: number, history: any[]) {
    const { error } = await supabase
      .from("conversations")
      .update({
        history,
        updated_at: new Date().toISOString()
      })
      .eq("store_id", this.storeId)
      .eq("id", id);

    if (error) throw error;
  }

}
