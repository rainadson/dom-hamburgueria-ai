export type PendingManualOrder = { request_id:string; order:unknown; reviewed_total:number; confirmed:true };
export function pendingKey(userId:string){return `dom-manual-pending:${userId}`;}
export function loadPending(storage:Pick<Storage,'getItem'>,userId:string):PendingManualOrder|null{
 const raw=storage.getItem(pendingKey(userId));if(raw===null)return null;
 const value=JSON.parse(raw);
 if(!value||typeof value.request_id!=='string'||typeof value.reviewed_total!=='number'||!Number.isFinite(value.reviewed_total)||value.confirmed!==true||!value.order)throw Error('Registo de envio pendente inválido. Verifique os pedidos antes de continuar.');
 return value;
}
export function savePending(storage:Pick<Storage,'setItem'>,userId:string,value:PendingManualOrder){
 storage.setItem(pendingKey(userId),JSON.stringify(value));
}
export function clearPending(storage:Pick<Storage,'removeItem'>,userId:string){storage.removeItem(pendingKey(userId));}
