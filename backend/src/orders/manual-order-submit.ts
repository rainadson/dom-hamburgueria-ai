import { createHash } from "node:crypto";
import { supabase } from "../database/supabase";
import { ManualOrderService } from "./manual-order.service";

export class ManualSubmitError extends Error {
  constructor(public status:number, message:string){super(message);}
}
function stable(value:any):string {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value==='object') return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
  return JSON.stringify(value) ?? 'null';
}
export class ManualOrderSubmit {
  private calculator: ManualOrderService;
  constructor(private storeId?: string) { this.calculator = new ManualOrderService(storeId); }
  async find(actor:string,key:string){
    const {data,error}=await supabase.from('orders').select('id,manual_payload_hash').eq('store_id',this.storeId).eq('manual_actor_id',actor).eq('manual_request_id',key).maybeSingle();
    if(error)throw new ManualSubmitError(503,'Não foi possível verificar este envio. Tente novamente sem alterar o pedido.');
    return data;
  }
  async insert(payload:any){return supabase.from('orders').insert({...payload,store_id:this.storeId}).select('id').single();}
  async submit(actor:string,key:unknown,input:any,reviewedTotal:unknown){
    if(typeof key!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key))throw new ManualSubmitError(400,'Identificador de envio inválido.');
    if(typeof reviewedTotal!=='number'||!Number.isFinite(reviewedTotal)||reviewedTotal<0)throw new ManualSubmitError(400,'Reveja o total antes de confirmar.');
    const hash=createHash('sha256').update(stable({input,reviewedTotal})).digest('hex');
    const reuse=(prior:any)=>{
      if(prior.manual_payload_hash!==hash)throw new ManualSubmitError(409,'Este identificador já foi usado para outro pedido.');
      return {id:prior.id,replayed:true};
    };
    const prior=await this.find(actor,key);if(prior)return reuse(prior);
    const order=await this.calculator.preview(input);
    if(order.total!==reviewedTotal)throw new ManualSubmitError(409,'Os preços mudaram. Reveja o pedido antes de confirmar.');
    const {data,error}=await this.insert({...order,status:'PENDING',manual_actor_id:actor,manual_request_id:key,manual_payload_hash:hash});
    if(error){
      // A restrição única no banco decide o vencedor mesmo entre processos.
      if(error.code==='23505'){const winner=await this.find(actor,key);if(winner)return reuse(winner);}
      throw new ManualSubmitError(503,'Não foi possível confirmar o resultado. Tente novamente com o mesmo pedido; não crie outro envio.');
    }
    return {id:data.id,replayed:false};
  }
}
