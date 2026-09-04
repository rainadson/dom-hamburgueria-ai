import {useAuth} from '../context/AuthContext';
import {loadPending,savePending,clearPending,type PendingManualOrder} from '../services/manual-pending';
import {useEffect,useState} from 'react';
import {api} from '../services/api';
import {authService} from '../services/auth.service';
import '../styles/manual-order.css';
type Line={product:string;quantity:number;notes:string;drink:string;toppings:string[];noToppings:boolean};
const emptyLine=():Line=>({product:'',quantity:1,notes:'',drink:'',toppings:[],noToppings:false});
const toppings=['Leite condensado','Leite em pó','Granola','Paçoca','Nutella','Banana'];
export default function ManualOrder(){
 const {profile}=useAuth();
 const [actorId,setActorId]=useState('');
 const [pending,setPending]=useState<PendingManualOrder|null>(null);const [pendingReady,setPendingReady]=useState(false);
 const [submitEnabled,setSubmitEnabled]=useState(false);const [sentId,setSentId]=useState<number|null>(null);const [confirmed,setConfirmed]=useState(false);const [reviewedInput,setReviewedInput]=useState<unknown>(null);
 useEffect(()=>{let active=true;api.get('/orders/manual/capabilities',{params:{_ts:Date.now()}}).then(({data})=>{if(active)setSubmitEnabled(data.submit_enabled===true);}).catch(()=>{});return()=>{active=false};},[]);
 useEffect(()=>{let active=true;setPendingReady(false);(async()=>{
  const id=profile?.user_id||(await authService.getUser())?.id||'';
  if(!active)return;
  if(!id){setError('Não foi possível identificar o operador. Entre novamente para continuar.');return;}
  try{setActorId(id);setPending(loadPending(sessionStorage,id));setPendingReady(true);}catch{setError('Não foi possível recuperar o envio anterior. Verifique os pedidos antes de continuar.');}
 })();return()=>{active=false};},[profile?.user_id]);
 const [customerSearch,setCustomerSearch]=useState('');const [customers,setCustomers]=useState<{name:string;phone:string}[]>([]);const [customerError,setCustomerError]=useState('');const [searching,setSearching]=useState(false);
 const [selectedCustomer,setSelectedCustomer]=useState<{name:string;phone:string}|null>(null);
 const [products,setProducts]=useState<{name:string;active:boolean}[]>([]);
 const [paymentMethods,setPaymentMethods]=useState<string[]>(['DINHEIRO','MULTIBANCO']);const [deliveryFee,setDeliveryFee]=useState<number|null>(null);
 const [form,setForm]=useState({customer_name:'',customer_phone:'',delivery_type:'PICKUP',address:'',payment_method:'MULTIBANCO',amount_paid:''});
 const [lines,setLines]=useState<Line[]>([emptyLine()]);const [error,setError]=useState('');const [busy,setBusy]=useState(false);
 const [preview,setPreview]=useState<{customer_name:string;customer_phone:string;delivery_type:string;address:string|null;payment_method:string;total:number;change:number;items:{product:string;quantity:number;subtotal:number;components?:string[]}[]}|null>(null);
 useEffect(()=>{let active=true;api.get('/products').then(({data})=>{if(active)setProducts(data.filter((p:{active:boolean})=>p.active));}).catch(()=>{if(active)setError('Não foi possível carregar os produtos. Reabra esta página para tentar novamente.');});return()=>{active=false};},[]);
 useEffect(()=>{let active=true;api.get('/settings').then(({data})=>{if(!active)return;setPaymentMethods(data.payment_methods||['DINHEIRO','MULTIBANCO']);setDeliveryFee(data.delivery_fee);if(!(data.payment_methods||[]).includes(form.payment_method))setForm(current=>({...current,payment_method:(data.payment_methods||[])[0]||''}));}).catch(()=>{});return()=>{active=false};},[]);
 useEffect(()=>{
  setCustomers([]);setCustomerError('');if(customerSearch.trim().length<2){setSearching(false);return;}
  let active=true;const controller=new AbortController();setSearching(true);
  const timer=setTimeout(async()=>{try{const {data}=await api.get('/orders/manual/customers',{params:{search:customerSearch.trim()},signal:controller.signal});if(active)setCustomers(data.items);}catch(e:any){if(active)setCustomerError(e.response?.data?.message||'Não foi possível buscar. Pode preencher o cliente manualmente.');}finally{if(active)setSearching(false);}},300);
  return()=>{active=false;controller.abort();clearTimeout(timer);};
 },[customerSearch]);
 useEffect(()=>{if(!selectedCustomer)return;setForm(current=>({...current,customer_name:selectedCustomer.name,customer_phone:String(selectedCustomer.phone)}));setSelectedCustomer(null);},[selectedCustomer]);
 function update(index:number,patch:Partial<Line>){setPreview(null);setLines(current=>current.map((line,i)=>i===index?{...line,...patch}:line));}
 async function review(e:React.FormEvent){
  e.preventDefault();if(pending||busy||sentId)return;setBusy(true);setError('');setPreview(null);setConfirmed(false);
  const input={...form,amount_paid:form.payment_method==='DINHEIRO'?Number(form.amount_paid.replace(',','.')):null,items:lines.map(line=>({product:line.product,quantity:line.quantity,notes:line.notes,drink:line.drink||undefined,toppings:line.noToppings?[]:line.toppings.length?line.toppings:undefined}))};
  try{const {data}=await api.post('/orders/manual/preview',input);setPreview(data.order);setReviewedInput(input);}catch(e:any){setError(e.response?.data?.message||'Não foi possível preparar o pedido.');}finally{setBusy(false);}
 }
 async function submit(){
  if(!actorId||!pendingReady||busy||sentId||!submitEnabled)return;
  if(!pending&&(!preview||!confirmed||!reviewedInput))return;
  setBusy(true);setError('');
  try{
   const request=pending||{request_id:crypto.randomUUID(),order:reviewedInput,reviewed_total:preview!.total,confirmed:true as const};
   // Persistir antes da rede: a mesma chave é reutilizada mesmo após recarregar.
   savePending(sessionStorage,actorId,request);setPending(request);
   const {data}=await api.post('/orders/manual/confirm',request);
   if(!Number.isSafeInteger(Number(data.id))||Number(data.id)<=0)throw Error('Resposta inesperada');
   setSentId(Number(data.id));clearPending(sessionStorage,actorId);setPending(null);
  }catch(e:any){setError(e.response?.data?.message||'Não foi possível confirmar o resultado. Verifique os pedidos ou tente novamente com o mesmo envio.');}
  finally{setBusy(false);}
 }
 function field(key:keyof typeof form,value:string){setPreview(null);setForm(current=>({...current,[key]:value}));}
 return <section className="manual-order"><h1>Preparar pedido manual</h1><p>Confira os produtos e os dados do cliente. O pedido só segue para a cozinha após rever e confirmar.</p>
 {sentId&&<p role="status">Pedido #{sentId} confirmado e enviado à cozinha.</p>}
 {pending&&!sentId&&<section className="manual-review"><h2>Envio pendente de confirmação</h2><p>Não inicie outro pedido para este envio. Pode verificar o resultado novamente sem duplicar o pedido.</p><p>Total revisto: € {pending.reviewed_total.toFixed(2)}</p><button disabled={busy||!submitEnabled} onClick={submit}>{busy?'A verificar…':'Verificar ou repetir o mesmo envio'}</button>{!submitEnabled&&<p>O envio está temporariamente indisponível. O registo pendente permanece guardado neste separador.</p>}</section>}
 <form onSubmit={review}><fieldset disabled={busy||!!pending||!!sentId||!pendingReady}><legend>Cliente</legend>
 <label>Buscar cliente de pedidos anteriores<input value={customerSearch} maxLength={100} placeholder="Nome ou telefone (mínimo 2 caracteres)" onChange={e=>setCustomerSearch(e.target.value)}/></label>
 {searching&&<p role="status">A buscar clientes…</p>}{customerError&&<p role="alert">{customerError}</p>}
 {!searching&&!customerError&&customerSearch.trim().length>=2&&!customers.length&&<p>Nenhum cliente encontrado. Preencha o nome e telefone abaixo.</p>}
 {customers.length>0&&<ul aria-label="Clientes encontrados">{customers.map(customer=><li key={customer.phone}><button type="button" onClick={()=>{setPreview(null);setCustomerSearch('');setSelectedCustomer(customer);}}>{customer.name||'Cliente sem nome'} — {customer.phone}</button></li>)}</ul>}
 <label>Nome<input required maxLength={150} value={form.customer_name} onChange={e=>field('customer_name',e.target.value)}/></label><label>Telefone<input required type="tel" maxLength={20} value={form.customer_phone} onChange={e=>field('customer_phone',e.target.value)}/></label></fieldset>
 <fieldset disabled={busy||!!pending||!!sentId||!pendingReady}><legend>Produtos</legend>{lines.map((line,i)=><div className="manual-line" key={i}>
 <label>Produto {i+1}<select required value={line.product} onChange={e=>update(i,{...emptyLine(),product:e.target.value})}><option value="">Escolha um produto</option>{products.map(p=><option key={p.name}>{p.name}</option>)}</select></label>
 <label>Quantidade<input required type="number" min={1} max={99} value={line.quantity} onChange={e=>update(i,{quantity:Number(e.target.value)})}/></label>
 {line.product.startsWith('Menu ')&&<label>Bebida incluída<select required value={line.drink} onChange={e=>update(i,{drink:e.target.value})}><option value="">Escolha a bebida</option><option>Coca-Cola (lata)</option><option>Coca-Cola Zero (lata)</option></select></label>}
 {line.product.startsWith('Açaí')&&<div><p>Até 2 toppings incluídos</p>{toppings.map(t=><label className="manual-check" key={t}><input type="checkbox" checked={line.toppings.includes(t)} disabled={line.noToppings||(!line.toppings.includes(t)&&line.toppings.length>=2)} onChange={e=>update(i,{toppings:e.target.checked?[...line.toppings,t]:line.toppings.filter(x=>x!==t)})}/>{t}</label>)}<label className="manual-check"><input type="checkbox" checked={line.noToppings} onChange={e=>update(i,{noToppings:e.target.checked,toppings:[]})}/>Sem toppings</label></div>}
 <label>Observações<textarea maxLength={500} value={line.notes} onChange={e=>update(i,{notes:e.target.value})}/></label><button type="button" disabled={lines.length===1} onClick={()=>{setPreview(null);setLines(current=>current.filter((_,n)=>n!==i));}}>Remover produto</button></div>)}<button type="button" disabled={lines.length>=50} onClick={()=>{setPreview(null);setLines(current=>[...current,emptyLine()]);}}>Adicionar produto</button></fieldset>
 <fieldset disabled={busy||!!pending||!!sentId||!pendingReady}><legend>Entrega e pagamento</legend><label>Receção<select value={form.delivery_type} onChange={e=>field('delivery_type',e.target.value)}><option value="PICKUP">Levantamento</option><option value="DELIVERY">Entrega</option></select></label>{form.delivery_type==='DELIVERY'&&<><label>Morada<textarea required maxLength={500} value={form.address} onChange={e=>field('address',e.target.value)}/></label><p>{deliveryFee===null?'Taxa de entrega não configurada; esta prévia considera € 0,00.':`Taxa de entrega: € ${Number(deliveryFee).toFixed(2)}`}</p></>}
 <label>Pagamento<select required value={form.payment_method} onChange={e=>field('payment_method',e.target.value)}>{paymentMethods.includes('MULTIBANCO')&&<option value="MULTIBANCO">Multibanco</option>}{paymentMethods.includes('DINHEIRO')&&<option value="DINHEIRO">Dinheiro</option>}</select></label>{form.payment_method==='DINHEIRO'&&<label>Valor entregue (€)<input required inputMode="decimal" value={form.amount_paid} onChange={e=>field('amount_paid',e.target.value)}/></label>}</fieldset>
 {error&&<p role="alert">{error}</p>}<button disabled={busy||!!pending||!!sentId||!pendingReady||!products.length}>{busy?'A calcular…':'Rever pedido'}</button></form>
 {preview&&<section className="manual-review" aria-label="Resumo do pedido"><h2>Prévia — não enviado</h2><p>{preview.customer_name} — {preview.customer_phone}</p><p>{preview.delivery_type==='DELIVERY'?'Entrega':'Levantamento'}{preview.address?` — ${preview.address}`:''}</p><p>Pagamento: {preview.payment_method}</p>{preview.items.map((item,i)=><div key={i}><p>{item.quantity} × {item.product} — € {item.subtotal.toFixed(2)}</p>{item.components?.map((c,n)=><p key={n}>{c}</p>)}</div>)}<strong>Total: € {preview.total.toFixed(2)}</strong>{form.payment_method==='DINHEIRO'&&<p>Troco: € {preview.change.toFixed(2)}</p>}{submitEnabled&&!pending&&!sentId?<><label className="manual-check"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)} disabled={busy}/>Conferi os dados e autorizo enviar este pedido à cozinha.</label><button onClick={submit} disabled={busy||!confirmed||!pendingReady}>Confirmar e enviar à cozinha</button></>:!sentId&&<p>O envio à cozinha ainda não está disponível nesta instalação.</p>}</section>}
 </section>;
}
