import { useEffect, useState } from "react";
import { createRefreshLoop } from "../services/refresh-loop";
import { api } from "../services/api";
import "../styles/conversations.css";
type Summary = {id:number;name:string|null;phone:string;state:string;updated_at:string};
type Detail = Summary & {handoff?:{active:boolean;owner_role:string;response_draft?:string};can_manage:boolean;history:{role:string;content:string}[]};
const labels:Record<string,string>={GREETING:"Início",WAITING_ORDER:"Em atendimento",UPSELL:"Adicionais",MENU_OFFER:"Oferta de Menu",MENU_DRINK:"Escolha da bebida",DELIVERY_TYPE:"Entrega ou levantamento",ADDRESS:"Morada",PAYMENT:"Pagamento",CASH_AMOUNT:"Troco",CONFIRMATION:"Confirmação",FINISHED:"Concluída",CANCELLED:"Cancelada"};
export default function Conversations(){
 const [busy,setBusy]=useState(false);const [reply,setReply]=useState("");const [actionMessage,setActionMessage]=useState("");
 const [search,setSearch]=useState("");const [page,setPage]=useState(0);
 const [items,setItems]=useState<Summary[]>([]);const [total,setTotal]=useState(0);
 const [selected,setSelected]=useState<number|null>(null);const [detail,setDetail]=useState<Detail|null>(null);
 const [error,setError]=useState("");const [detailError,setDetailError]=useState("");const [loading,setLoading]=useState(true);
 useEffect(()=>{
  setLoading(true);
  const loop=createRefreshLoop<{items:Summary[];total:number}>({
   read:async signal=>{const {data}=await api.get('/conversations',{params:{search,page},signal});return data;},
   receive:data=>{setItems(data.items);setTotal(data.total);setError("");setLoading(false);},
   failure:()=>{setError("Não foi possível atualizar as conversas. Tentaremos novamente automaticamente.");setLoading(false);},
   delay:10000,
  });
  const onFocus=()=>{void loop.refresh();};
  window.addEventListener('focus',onFocus);
  const debounce=setTimeout(()=>{void loop.refresh();},300);
  return()=>{clearTimeout(debounce);loop.stop();window.removeEventListener('focus',onFocus);};
 },[search,page]);
 useEffect(()=>{setDetail(null);setDetailError("");setReply("");setActionMessage("");},[selected]);
 useEffect(()=>{
  // Suspende leituras durante ações: uma resposta antiga não pode desfazer o estado revisto.
  if(selected===null||busy)return;
  const loop=createRefreshLoop<Detail>({
   read:async signal=>{const {data}=await api.get(`/conversations/${selected}`,{signal});return data;},
   receive:data=>{setDetail(data);setDetailError("");},
   failure:()=>setDetailError("Não foi possível atualizar esta conversa."),
   delay:5000,
  });
  const onFocus=()=>{void loop.refresh();};
  window.addEventListener('focus',onFocus);
  void loop.refresh();
  return()=>{loop.stop();window.removeEventListener('focus',onFocus);};
 },[selected,busy]);
 async function act(action:"take"|"resume"|"draft") {
  if(selected===null||busy)return;
  const id=selected;setBusy(true);setActionMessage("");
  try{await api.post(`/conversations/${id}/${action}`,action==='draft'?{text:reply}:{});setDetail(null);setActionMessage(action==='draft'?"Resposta guardada. Não foi enviada ao cliente.":action==='take'?"Atendimento assumido. A IA está pausada.":"IA retomada.");}
  catch(error:any){setActionMessage(error.response?.data?.message||"Não foi possível concluir a ação. Verifique o estado antes de tentar novamente.");}
  finally{setBusy(false);}
 }
 return <section className="conversations-page"><h1>Conversas</h1><p>Acompanhe o atendimento dos clientes. Atualização automática.</p>
 <div className="conversations-grid"><aside className="conversation-list"><label htmlFor="conversation-search">Buscar por nome ou telefone</label><input id="conversation-search" value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}} placeholder="Nome ou telefone"/>
 {error&&<p role="alert">{error}</p>}{loading&&<p role="status">Carregando…</p>}
 {!loading&&!error&&!items.length&&<p>Nenhuma conversa encontrada.</p>}
 {items.map(item=><button type="button" key={item.id} className={selected===item.id?'conversation-entry selected':'conversation-entry'} disabled={busy} onClick={()=>setSelected(item.id)} aria-pressed={selected===item.id}><strong>{item.name||item.phone}</strong>{item.name&&<span>{item.phone}</span>}<span>{labels[item.state]||"Em atendimento"}</span><small>{item.updated_at?new Date(item.updated_at).toLocaleString('pt-PT'):''}</small></button>)}
 <div className="conversation-pagination"><button disabled={page===0} onClick={()=>setPage(p=>p-1)}>Anterior</button><span>{page+1} / {Math.max(1,Math.ceil(total/30))}</span><button disabled={(page+1)*30>=total} onClick={()=>setPage(p=>p+1)}>Seguinte</button></div></aside>
 <article className="conversation-history" aria-label="Histórico da conversa">{selected===null?<p>Selecione uma conversa para ver o histórico.</p>:<>{detailError&&<p role="alert">{detailError}</p>}{!detail&&!detailError&&<p role="status">Carregando histórico…</p>}{detail&&<><header><h2>{detail.name||detail.phone}</h2><p>{detail.name?`${detail.phone} · `:''}{labels[detail.state]||"Em atendimento"}</p></header><div className="conversation-messages">{detail.history.length?detail.history.map((m,i)=><div key={i} className={`conversation-bubble ${m.role==='user'?'customer':'assistant'}`}><strong>{m.role==='user'?'Cliente':m.role==='event'?'Atendimento':'Dom AI'}</strong><p>{m.content}</p></div>):<p>Esta conversa ainda não tem mensagens.</p>}</div><footer className="handoff-controls">
 <p>{detail.handoff?.active?`IA pausada · Responsável: ${detail.handoff.owner_role}`:'IA ativa'}</p>
 {!detail.handoff?.active?<button disabled={busy} onClick={()=>act('take')}>Assumir atendimento</button>:detail.can_manage?<>
 <button disabled={busy} onClick={()=>act('resume')}>Retomar IA</button>
 <label htmlFor="human-reply">Preparar resposta</label><textarea id="human-reply" maxLength={4000} value={reply} onChange={e=>setReply(e.target.value)} disabled={busy} />
 <button disabled={busy||!reply.trim()} onClick={()=>act('draft')}>Guardar resposta</button>
 {detail.handoff.response_draft&&<p>Resposta guardada: {detail.handoff.response_draft}</p>}
 <p>O envio ao cliente ainda não está disponível. As respostas ficam guardadas aqui até a integração WhatsApp.</p>
 </>:<p>Outro atendente está responsável por esta conversa.</p>}
 {actionMessage&&<p role="status">{actionMessage}</p>}
 </footer></>}</>}</article></div></section>;
}
