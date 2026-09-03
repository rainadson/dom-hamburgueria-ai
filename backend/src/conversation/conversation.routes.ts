import { HumanHandoffService, HandoffError } from "./human-handoff.service";
import { Router } from "express";
import { supabase } from "../database/supabase";
import { positiveId, queryPage, querySearch } from "../middlewares/http-input";

const router = Router();
router.get("/", async (req, res) => {
  const page = queryPage(req.query.page);
  if (page === null) return res.status(400).json({ message: "Página inválida." });
  const search = querySearch(req.query.search);
  if (search === null) return res.status(400).json({ message: "Busca inválida." });
  let query = supabase.from("conversations").select("id,phone,state,updated_at,order_draft", {count:"exact"}).eq("store_id",req.auth!.storeId);
  if (search) query = query.or(`phone.ilike.%${search}%,order_draft->>customer_name.ilike.%${search}%`);
  const {data,error,count} = await query.order("updated_at",{ascending:false}).order("id",{ascending:false}).range(page*30,page*30+29);
  if (error) return res.status(500).json({message:"Não foi possível carregar as conversas."});
  return res.json({items:(data || []).map(row=>({id:row.id,phone:row.phone,state:row.state,updated_at:row.updated_at,name:row.order_draft?.customer_name || null,handoff:row.order_draft?.handoff?{active:!!row.order_draft.handoff.active,owner_id:row.order_draft.handoff.owner_id}:null})),total:count || 0});
});
router.get("/:id", async (req,res)=>{
  const id = positiveId(req.params.id);
  if (id === null) return res.status(400).json({message:"Conversa inválida."});
  const {data,error}=await supabase.from("conversations").select("id,phone,state,updated_at,history,order_draft").eq("store_id",req.auth!.storeId).eq("id",id).maybeSingle();
  if(error)return res.status(500).json({message:"Não foi possível carregar o histórico."});
  if(!data)return res.status(404).json({message:"Conversa não encontrada."});
  return res.json({id:data.id,phone:data.phone,state:data.state,updated_at:data.updated_at,name:data.order_draft?.customer_name || null,handoff:data.order_draft?.handoff || null,can_manage:!data.order_draft?.handoff?.active || data.order_draft.handoff.owner_id===req.auth?.id,
    history:(Array.isArray(data.history)?data.history:[]).filter((m:any)=>["user","assistant","event"].includes(m.role)&&typeof m.content==="string").map((m:any)=>({role:m.role,content:m.content}))});
});
const handoffService = new HumanHandoffService();
for (const action of ["take", "resume", "draft"] as const) {
  router.post(`/:id/${action}`, async (req, res) => {
    try {
      if (!req.auth) return res.status(401).json({message:"Autenticação necessária."});
      const id = positiveId(req.params.id);
      if (id === null) return res.status(400).json({message:"Conversa inválida."});
      const result = await handoffService.act(id, req.auth, action, req.body?.text);
      return res.json(result);
    } catch (error) {
      return res.status(error instanceof HandoffError ? error.status : 500).json({message:error instanceof HandoffError ? error.message : "Não foi possível atualizar o atendimento."});
    }
  });
}
export default router;
