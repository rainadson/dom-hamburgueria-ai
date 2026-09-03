export type MetaMessage = {key:string;id:string;phoneNumberId:string;accountId:string;sender:string;timestamp:string;type:string;text?:string;processable:boolean};
export type MetaStatus = {id:string;status:string;timestamp:string};
const text = (value:unknown,max:number):value is string => typeof value==='string'&&value.length>0&&value.length<=max;
// Apenas normalização: não lê o banco nem executa mensagens.
export function normalizeMetaMessages(envelope:any, expected:{accountId:string;phoneNumberId:string}) {
 if(!/^\d+$/.test(expected.accountId)||!/^\d+$/.test(expected.phoneNumberId))throw Error('Identidade da loja não configurada.');
 if(envelope?.object!=='whatsapp_business_account'||!Array.isArray(envelope.entry))throw Error('Envelope inválido.');
 const messages:MetaMessage[]=[];const statuses:MetaStatus[]=[];const seen=new Map<string,string>();let ignoredChanges=0;
 for(const entry of envelope.entry){
  if(entry?.id!==expected.accountId){ignoredChanges++;continue;}
  if(!Array.isArray(entry.changes))throw Error('Alterações inválidas.');
  for(const change of entry.changes){
   const value=change?.value;
   if(change?.field!=='messages'||value?.messaging_product!=='whatsapp'||value?.metadata?.phone_number_id!==expected.phoneNumberId){ignoredChanges++;continue;}
   if(value.statuses!==undefined&&!Array.isArray(value.statuses))throw Error('Estados inválidos.');
   for(const status of value.statuses||[]){
    if(!text(status?.id,512)||!text(status?.status,50)||!text(status?.timestamp,16)||!/^\d+$/.test(status.timestamp))throw Error('Estado inválido.');
    statuses.push({id:status.id,status:status.status,timestamp:status.timestamp});
   }
   if(value.messages!==undefined&&!Array.isArray(value.messages))throw Error('Mensagens inválidas.');
   for(const message of value.messages||[]){
    if(!text(message?.id,512)||!text(message?.from,20)||!/^\d{6,20}$/.test(message.from)||!text(message?.timestamp,16)||!/^\d+$/.test(message.timestamp)||!text(message?.type,50))throw Error('Mensagem inválida.');
    if(message.type==='text'&&!text(message.text?.body,4096))throw Error('Texto inválido.');
    const normalized:MetaMessage={key:JSON.stringify([entry.id,expected.phoneNumberId,message.id]),id:message.id,phoneNumberId:expected.phoneNumberId,accountId:entry.id,sender:message.from,timestamp:message.timestamp,type:message.type,processable:message.type==='text',...(message.type==='text'?{text:message.text.body}:{})};
    const signature=JSON.stringify(normalized);
    if(seen.has(normalized.key)){if(seen.get(normalized.key)!==signature)throw Error('ID de mensagem com conteúdo conflitante.');continue;}
    seen.set(normalized.key,signature);messages.push(normalized);
   }
  }
 }
 return {messages,statuses,ignoredChanges};
}
