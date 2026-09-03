import {supabase} from "../database/supabase";
import {inboxEnvelope} from "./meta-inbox";
import {normalizeMetaMessages} from "./meta-messages";

// Preparação isolada: a função SQL ainda não foi aplicada nem ligada ao webhook.
export class MetaMessageStore {
  constructor(private readonly expected:{accountId:string;phoneNumberId:string}) {}
  async persist(event:unknown) {
    const envelope=inboxEnvelope(event);
    const batch=normalizeMetaMessages(envelope.payload,this.expected);
    const {error}=await supabase.rpc('store_whatsapp_messages', {
      p_event_key:envelope.event_key,
      p_messages:batch.messages,
    });
    if(error)throw Error('Não foi possível guardar as mensagens WhatsApp.');
    return {messages:batch.messages.length,ignoredChanges:batch.ignoredChanges};
  }
}
