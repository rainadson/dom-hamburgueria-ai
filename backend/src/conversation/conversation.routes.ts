import { Router } from "express";
import { supabase } from "../database/supabase";

const router = Router();
router.get("/", async (req, res) => {
  const page = Number(req.query.page || 0);
  if (!Number.isSafeInteger(page) || page < 0) return res.status(400).json({ message: "Página inválida." });
  const search = String(req.query.search || "").trim().slice(0, 100).replace(/[^\p{L}\p{N} +@._-]/gu, "");
  let query = supabase.from("conversations").select("id,phone,state,updated_at,order_draft", {count:"exact"});
  if (search) query = query.or(`phone.ilike.%${search}%,order_draft->>customer_name.ilike.%${search}%`);
  const {data,error,count} = await query.order("updated_at",{ascending:false}).order("id",{ascending:false}).range(page*30,page*30+29);
  if (error) return res.status(500).json({message:"Não foi possível carregar as conversas."});
  return res.json({items:(data || []).map(row=>({id:row.id,phone:row.phone,state:row.state,updated_at:row.updated_at,name:row.order_draft?.customer_name || null})),total:count || 0});
});
router.get("/:id", async (req,res)=>{
  if (!/^\d+$/.test(String(req.params.id))) return res.status(400).json({message:"Conversa inválida."});
  const {data,error}=await supabase.from("conversations").select("id,phone,state,updated_at,history,order_draft").eq("id",req.params.id).maybeSingle();
  if(error)return res.status(500).json({message:"Não foi possível carregar o histórico."});
  if(!data)return res.status(404).json({message:"Conversa não encontrada."});
  return res.json({id:data.id,phone:data.phone,state:data.state,updated_at:data.updated_at,name:data.order_draft?.customer_name || null,
    history:(Array.isArray(data.history)?data.history:[]).filter((m:any)=>["user","assistant"].includes(m.role)&&typeof m.content==="string").map((m:any)=>({role:m.role,content:m.content}))});
});
export default router;
