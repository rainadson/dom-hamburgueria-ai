import { useEffect, useState } from "react";
import { api } from "../services/api";
import "../styles/conversations.css";
type Summary = {id:number;name:string|null;phone:string;state:string;updated_at:string};
type Detail = Summary & {history:{role:string;content:string}[]};
const labels:Record<string,string>={GREETING:"Início",WAITING_ORDER:"Em atendimento",UPSELL:"Adicionais",MENU_OFFER:"Oferta de Menu",MENU_DRINK:"Escolha da bebida",DELIVERY_TYPE:"Entrega ou levantamento",ADDRESS:"Morada",PAYMENT:"Pagamento",CASH_AMOUNT:"Troco",CONFIRMATION:"Confirmação",FINISHED:"Concluída",CANCELLED:"Cancelada"};
export default function Conversations(){
 const [search,setSearch]=useState("");const [page,setPage]=useState(0);
 const [items,setItems]=useState<Summary[]>([]);const [total,setTotal]=useState(0);
 const [selected,setSelected]=useState<number|null>(null);const [detail,setDetail]=useState<Detail|null>(null);
 const [error,setError]=useState("");const [detailError,setDetailError]=useState("");const [loading,setLoading]=useState(true);
 useEffect(()=>{let stopped=false;let timer:ReturnType<typeof setTimeout>;const controller=new AbortController();
  setLoading(true);
  async function load(){try{const {data}=await api.get('/conversations',{params:{search,page},signal:controller.signal});if(!stopped){setItems(data.items);setTotal(data.total);setError("");}}catch{if(!stopped)setError("Não foi possível atualizar as conversas. Tentaremos novamente automaticamente.");}finally{if(!stopped){setLoading(false);timer=setTimeout(load,10000);}}}
  const debounce=setTimeout(load,300);return()=>{stopped=true;controller.abort();clearTimeout(debounce);clearTimeout(timer);};
 },[search,page]);
 useEffect(()=>{setDetail(null);setDetailError("");if(selected===null)return;let stopped=false;let timer:ReturnType<typeof setTimeout>;const controller=new AbortController();
  async function load(){try{const {data}=await api.get(`/conversations/${selected}`,{signal:controller.signal});if(!stopped){setDetail(data);setDetailError("");}}catch{if(!stopped)setDetailError("Não foi possível atualizar esta conversa.");}finally{if(!stopped)timer=setTimeout(load,5000);}}
  load();return()=>{stopped=true;controller.abort();clearTimeout(timer);};
 },[selected]);
 return <section className="conversations-page"><h1>Conversas</h1><p>Acompanhe o atendimento dos clientes. Atualização automática.</p>
 <div className="conversations-grid"><aside className="conversation-list"><label htmlFor="conversation-search">Buscar por nome ou telefone</label><input id="conversation-search" value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}} placeholder="Nome ou telefone"/>
 {error&&<p role="alert">{error}</p>}{loading&&<p role="status">Carregando…</p>}
 {!loading&&!error&&!items.length&&<p>Nenhuma conversa encontrada.</p>}
 {items.map(item=><button type="button" key={item.id} className={selected===item.id?'conversation-entry selected':'conversation-entry'} onClick={()=>setSelected(item.id)} aria-pressed={selected===item.id}><strong>{item.name||item.phone}</strong>{item.name&&<span>{item.phone}</span>}<span>{labels[item.state]||"Em atendimento"}</span><small>{item.updated_at?new Date(item.updated_at).toLocaleString('pt-PT'):''}</small></button>)}
 <div className="conversation-pagination"><button disabled={page===0} onClick={()=>setPage(p=>p-1)}>Anterior</button><span>{page+1} / {Math.max(1,Math.ceil(total/30))}</span><button disabled={(page+1)*30>=total} onClick={()=>setPage(p=>p+1)}>Seguinte</button></div></aside>
 <article className="conversation-history" aria-label="Histórico da conversa">{selected===null?<p>Selecione uma conversa para ver o histórico.</p>:<>{detailError&&<p role="alert">{detailError}</p>}{!detail&&!detailError&&<p role="status">Carregando histórico…</p>}{detail&&<><header><h2>{detail.name||detail.phone}</h2><p>{detail.name?`${detail.phone} · `:''}{labels[detail.state]||"Em atendimento"}</p></header><div className="conversation-messages">{detail.history.length?detail.history.map((m,i)=><div key={i} className={`conversation-bubble ${m.role==='user'?'customer':'assistant'}`}><strong>{m.role==='user'?'Cliente':'Dom AI'}</strong><p>{m.content}</p></div>):<p>Esta conversa ainda não tem mensagens.</p>}</div><footer>Visualização do histórico. Atendimento manual disponível numa próxima etapa.</footer></>}</>}</article></div></section>;
}
