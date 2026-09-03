import {createHash} from "node:crypto";
import {supabase} from "../database/supabase";

function canonical(value:any):string {
  if(value===null||typeof value!=="object")return JSON.stringify(value);
  if(Array.isArray(value))return `[${value.map(canonical).join(',')}]`;
  return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
}
export function inboxEnvelope(event:unknown){
  const encoded=JSON.stringify(event);
  if(!encoded||Buffer.byteLength(encoded,'utf8')>1024*1024)throw Error('Envelope inválido.');
  const normalized=JSON.parse(encoded);
  if(normalized?.object!=="whatsapp_business_account"||!Array.isArray(normalized.entry))throw Error('Envelope inválido.');
  return {event_key:createHash('sha256').update(canonical(normalized)).digest('hex'),payload:normalized};
}
// Sem chamadas ao modelo, cliente ou cozinha. Não montado no webhook ativo.
export class MetaInbox {
  async persist(event:unknown){
    const envelope=inboxEnvelope(event);
    const {error}=await supabase.from('whatsapp_inbox').upsert(envelope,{onConflict:'event_key',ignoreDuplicates:true});
    if(error)throw Error('Não foi possível guardar o evento WhatsApp.');
  }
}
