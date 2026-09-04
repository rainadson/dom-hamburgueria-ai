export class SettingsInputError extends Error {}
const optionalText=(value:unknown,label:string,max:number)=>{
  if(value===null||value===undefined||value==="")return null;
  if(typeof value!=="string"||!value.trim()||value.trim().length>max)throw new SettingsInputError(`${label} inválido.`);
  return value.trim();
};
export function settingsInput(value:any){
  if(!value||typeof value!=="object"||Array.isArray(value))throw new SettingsInputError("Configurações inválidas.");
  const restaurant_name=optionalText(value.restaurant_name,"Nome",150);
  if(!restaurant_name)throw new SettingsInputError("Nome inválido.");
  const phone=optionalText(value.phone,"Telefone",20);
  if(phone&&!/^\+?[0-9 ()-]{6,20}$/.test(phone))throw new SettingsInputError("Telefone inválido.");
  const fee=value.delivery_fee;
  if(fee!==null&&fee!==undefined&&(typeof fee!=="number"||!Number.isFinite(fee)||fee<0||fee>1000||Math.abs(fee*100-Math.round(fee*100))>.00001))throw new SettingsInputError("Taxa de entrega inválida.");
  if(!Array.isArray(value.payment_methods)||!value.payment_methods.length)throw new SettingsInputError("Escolha ao menos um pagamento.");
  const payment_methods=[...new Set(value.payment_methods)];
  if(payment_methods.some(method=>method!=="DINHEIRO"&&method!=="MULTIBANCO"))throw new SettingsInputError("Pagamento inválido.");
  return {restaurant_name,phone,address:optionalText(value.address,"Morada",500),opening_hours:optionalText(value.opening_hours,"Horário",1000),delivery_fee:fee==null?null:Math.round(fee*100)/100,payment_methods,ai_greeting:optionalText(value.ai_greeting,"Saudação",500),ai_unknown_reply:optionalText(value.ai_unknown_reply,"Mensagem de dúvida",500),ai_personality:optionalText(value.ai_personality,"Personalidade",1000),updated_at:new Date().toISOString()};
}
