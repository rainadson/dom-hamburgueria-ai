import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {api} from '../services/api';
import '../styles/whatsapp.css';
type Status={connection:string;receiving:boolean;sending:boolean;media:boolean;humanReplies:boolean;catalogImage:string};
export default function WhatsApp(){
 const [status,setStatus]=useState<Status|null>(null);const [error,setError]=useState('');const [attempt,setAttempt]=useState(0);
 useEffect(()=>{let active=true;const controller=new AbortController();setError('');setStatus(null);api.get('/whatsapp/status',{signal:controller.signal}).then(({data})=>{if(active)setStatus(data);}).catch(()=>{if(active)setError('Não foi possível consultar o estado da integração.');});return()=>{active=false;controller.abort();};},[attempt]);
 return <section className="whatsapp-page"><h1>WhatsApp</h1><p>Acompanhe a ligação do número da loja ao atendimento Dom AI.</p>
 {error?<div role="alert"><p>{error}</p><button onClick={()=>setAttempt(n=>n+1)}>Tentar novamente</button></div>:!status?<p role="status">A consultar a integração…</p>:<>
 <section className="whatsapp-card"><h2>Integração ainda não conectada</h2><p>As conversas e os pedidos já podem ser acompanhados no sistema. A troca de mensagens com clientes pelo WhatsApp ainda não está disponível.</p>
 <ul><li>Receber mensagens: {status.receiving?'Disponível':'Pendente'}</li><li>Enviar mensagens: {status.sending?'Disponível':'Pendente'}</li><li>Enviar e receber imagens: {status.media?'Disponível':'Pendente'}</li><li>Enviar respostas de atendentes: {status.humanReplies?'Disponível':'Pendente'}</li></ul></section>
 <section className="whatsapp-card"><h2>O que falta para conectar</h2><ol><li>Preparar a conta empresarial Meta e identificar o número da loja.</li><li>Concluir a configuração do aplicativo e da receção de mensagens.</li><li>Validar envio, recebimento e imagem do cardápio com um número de teste autorizado.</li></ol><p>Não partilhe senhas ou tokens nesta página. A configuração da integração será feita numa etapa própria.</p></section>
 <section className="whatsapp-card"><h2>Cardápio preparado</h2><p>A imagem oficial já está disponível para ser ligada ao envio de mensagens.</p><a href={status.catalogImage} target="_blank" rel="noreferrer">Ver imagem do cardápio</a></section>
 <Link to="/conversations">Abrir Central de Conversas</Link>
 </>}</section>;
}
