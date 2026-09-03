import { supabase } from "../database/supabase";
import { withConversationLock } from "./conversation-lock";
import type { AuthenticatedUser } from "../middlewares/auth.middleware";

export class HandoffError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export class HumanHandoffService {
  async find(id: number) {
    const { data, error } = await supabase.from("conversations").select("id,phone,history,order_draft").eq("id", id).maybeSingle();
    if (error) throw new HandoffError(500, "Não foi possível carregar a conversa.");
    if (!data) throw new HandoffError(404, "Conversa não encontrada.");
    return data;
  }

  async act(id: number, actor: AuthenticatedUser, action: "take" | "resume" | "draft", text?: unknown) {
    if (!Number.isSafeInteger(id) || id <= 0) throw new HandoffError(400, "Conversa inválida.");
    if (!["ADMIN", "LOJA"].includes(actor.role)) throw new HandoffError(403, "Acesso não autorizado.");
    if (action === "draft" && (typeof text !== "string" || !text.trim() || text.trim().length > 4000)) {
      throw new HandoffError(400, "Escreva uma resposta com até 4000 caracteres.");
    }
    const initial = await this.find(id);
    return withConversationLock(initial.phone, async () => {
      const conversation = await this.find(id);
      const draft = conversation.order_draft || {};
      const handoff = draft.handoff;
      if (handoff?.active && handoff.owner_id !== actor.id) {
        throw new HandoffError(409, "Esta conversa já está com outro atendente. Aguarde a retomada da IA.");
      }
      if (action !== "take" && !handoff?.active) throw new HandoffError(409, "Assuma o atendimento primeiro.");
      if (action === "take" && handoff?.active) return { handoff, delivery: "not_sent" };
      const now = new Date().toISOString();
      let next = { ...handoff };
      if (action === "take") next = { active: true, owner_id: actor.id, owner_role: actor.role, started_at: now };
      if (action === "resume") next = { ...next, active: false, ended_at: now };
      if (action === "draft") next = { ...next, response_draft: String(text).trim(), response_saved_at: now };
      const history = [...(conversation.history || [])];
      // Eventos internos nunca são enviados ao cliente nem apresentados à IA como falas.
      if (action !== "draft") history.push({ role: "event", content: action === "take" ? "Atendimento assumido; IA pausada." : "IA retomada.", actor_id: actor.id, actor_role: actor.role, created_at: now });
      const { error } = await supabase.from("conversations").update({ order_draft: { ...draft, handoff: next }, history, updated_at: now }).eq("id", id);
      if (error) throw new HandoffError(500, "Não foi possível guardar a alteração.");
      return { handoff: next, delivery: "not_sent" };
    });
  }
}
