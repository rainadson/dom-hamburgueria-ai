import {useEffect,useState} from 'react';
import {api} from '../services/api';
import '../styles/manual-order.css';
type Line={product:string;quantity:number;notes:string;drink:string;toppings:string[];noToppings:boolean};
const emptyLine=():Line=>({product:'',quantity:1,notes:'',drink:'',toppings:[],noToppings:false});
const toppings=['Leite condensado','Leite em pó','Granola','Paçoca','Nutella','Banana'];
export default function ManualOrder(){
 const [customerSearch,setCustomerSearch]=useState('');const [customers,setCustomers]=useState<{name:string;phone:string}[]>([]);const [customerError,setCustomerError]=useState('');const [searching,setSearching]=useState(false);
 const [products,setProducts]=useState<{name:string;active:boolean}[]>([]);
 const [form,setForm]=useState({customer_name:'',customer_phone:'',delivery_type:'PICKUP',address:'',payment_method:'MULTIBANCO',amount_paid:''});
 const [lines,setLines]=useState<Line[]>([emptyLine()]);const [error,setError]=useState('');const [busy,setBusy]=useState(false);
 const [preview,setPreview]=useState<{total:number;change:number;items:{product:string;quantity:number;subtotal:number;components?:string[]}[]}|null>(null);
 useEffect(()=>{let active=true;api.get('/products').then(({data})=>{if(active)setProducts(data.filter((p:{active:boolean})=>p.active));}).catch(()=>{if(active)setError('Não foi possível carregar os produtos. Reabra esta página para tentar novamente.');});return()=>{active=false};},[]);
 useEffect(()=>{
  setCustomers([]);setCustomerError('');if(customerSearch.trim().length<2){setSearching(false);return;}
  let active=true;const controller=new AbortController();setSearching(true);
  const timer=setTimeout(async()=>{try{const {data}=await api.get('/orders/manual/customers',{params:{search:customerSearch.trim()},signal:controller.signal});if(active)setCustomers(data.items);}catch(e:any){if(active)setCustomerError(e.response?.data?.message||'Não foi possível buscar. Pode preencher o cliente manualmente.');}finally{if(active)setSearching(false);}},300);
  return()=>{active=false;controller.abort();clearTimeout(timer);};
 },[customerSearch]);
 function update(index:number,patch:Partial<Line>){setPreview(null);setLines(current=>current.map((line,i)=>i===index?{...line,...patch}:line));}
 async function review(e:React.FormEvent){e.preventDefault();setBusy(true);setError('');setPreview(null);try{const {data}=await api.post('/orders/manual/preview',{...form,amount_paid:form.payment_method==='DINHEIRO'?Number(form.amount_paid.replace(',','.')):null,items:lines.map(line=>({product:line.product,quantity:line.quantity,notes:line.notes,drink:line.drink||undefined,toppings:line.noToppings?[]:line.toppings.length?line.toppings:undefined}))});setPreview(data.order);}catch(e:any){setError(e.response?.data?.message||'Não foi possível preparar o pedido.');}finally{setBusy(false);}}
 function field(key:keyof typeof form,value:string){setPreview(null);setForm(current=>({...current,[key]:value}));}
 return <section className="manual-order"><h1>Preparar pedido manual</h1><p>Confira os produtos e os dados do cliente. Esta etapa não envia pedidos à cozinha.</p>
 <form onSubmit={review}><fieldset disabled={busy}><legend>Cliente</legend>
 <label>Buscar cliente de pedidos anteriores<input value={customerSearch} maxLength={100} placeholder="Nome ou telefone (mínimo 2 caracteres)" onChange={e=>setCustomerSearch(e.target.value)}/></label>
 {searching&&<p role="status">A buscar clientes…</p>}{customerError&&<p role="alert">{customerError}</p>}
 {!searching&&!customerError&&customerSearch.trim().length>=2&&!customers.length&&<p>Nenhum cliente encontrado. Preencha o nome e telefone abaixo.</p>}
 {customers.length>0&&<ul aria-label="Clientes encontrados">{customers.map(customer=><li key={customer.phone}><button type="button" onClick={()=>{setPreview(null);setForm(current=>({...current,customer_name:customer.name,customer_phone:customer.phone}));setCustomerSearch('');}}>{customer.name||'Cliente sem nome'} — {customer.phone}</button></li>)}</ul>}
 <label>Nome<input required maxLength={150} value={form.customer_name} onChange={e=>field('customer_name',e.target.value)}/></label><label>Telefone<input required type="tel" maxLength={20} value={form.customer_phone} onChange={e=>field('customer_phone',e.target.value)}/></label></fieldset>
 <fieldset disabled={busy}><legend>Produtos</legend>{lines.map((line,i)=><div className="manual-line" key={i}>
 <label>Produto {i+1}<select required value={line.product} onChange={e=>update(i,{...emptyLine(),product:e.target.value})}><option value="">Escolha um produto</option>{products.map(p=><option key={p.name}>{p.name}</option>)}</select></label>
 <label>Quantidade<input required type="number" min={1} max={99} value={line.quantity} onChange={e=>update(i,{quantity:Number(e.target.value)})}/></label>
 {line.product.startsWith('Menu ')&&<label>Bebida incluída<select required value={line.drink} onChange={e=>update(i,{drink:e.target.value})}><option value="">Escolha a bebida</option><option>Coca-Cola (lata)</option><option>Coca-Cola Zero (lata)</option></select></label>}
 {line.product.startsWith('Açaí')&&<div><p>Até 2 toppings incluídos</p>{toppings.map(t=><label className="manual-check" key={t}><input type="checkbox" checked={line.toppings.includes(t)} disabled={line.noToppings||(!line.toppings.includes(t)&&line.toppings.length>=2)} onChange={e=>update(i,{toppings:e.target.checked?[...line.toppings,t]:line.toppings.filter(x=>x!==t)})}/>{t}</label>)}<label className="manual-check"><input type="checkbox" checked={line.noToppings} onChange={e=>update(i,{noToppings:e.target.checked,toppings:[]})}/>Sem toppings</label></div>}
 <label>Observações<textarea maxLength={500} value={line.notes} onChange={e=>update(i,{notes:e.target.value})}/></label><button type="button" disabled={lines.length===1} onClick={()=>{setPreview(null);setLines(current=>current.filter((_,n)=>n!==i));}}>Remover produto</button></div>)}<button type="button" disabled={lines.length>=50} onClick={()=>{setPreview(null);setLines(current=>[...current,emptyLine()]);}}>Adicionar produto</button></fieldset>
 <fieldset disabled={busy}><legend>Entrega e pagamento</legend><label>Receção<select value={form.delivery_type} onChange={e=>field('delivery_type',e.target.value)}><option value="PICKUP">Levantamento</option><option value="DELIVERY">Entrega</option></select></label>{form.delivery_type==='DELIVERY'&&<><label>Morada<textarea required maxLength={500} value={form.address} onChange={e=>field('address',e.target.value)}/></label><p>Taxa de entrega ainda não configurada; esta prévia considera € 0,00 de taxa.</p></>}
 <label>Pagamento<select value={form.payment_method} onChange={e=>field('payment_method',e.target.value)}><option value="MULTIBANCO">Multibanco</option><option value="DINHEIRO">Dinheiro</option></select></label>{form.payment_method==='DINHEIRO'&&<label>Valor entregue (€)<input required inputMode="decimal" value={form.amount_paid} onChange={e=>field('amount_paid',e.target.value)}/></label>}</fieldset>
 {error&&<p role="alert">{error}</p>}<button disabled={busy||!products.length}>{busy?'A calcular…':'Rever pedido'}</button></form>
 {preview&&<section className="manual-review" aria-label="Resumo do pedido"><h2>Prévia — não enviado</h2>{preview.items.map((item,i)=><div key={i}><p>{item.quantity} × {item.product} — € {item.subtotal.toFixed(2)}</p>{item.components?.map((c,n)=><p key={n}>{c}</p>)}</div>)}<strong>Total: € {preview.total.toFixed(2)}</strong>{form.payment_method==='DINHEIRO'&&<p>Troco: € {preview.change.toFixed(2)}</p>}<p>A confirmação e o envio à cozinha serão disponibilizados na próxima etapa.</p></section>}
 </section>;
}
