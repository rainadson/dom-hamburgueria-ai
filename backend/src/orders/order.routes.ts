import { ManualOrderSubmit, ManualSubmitError } from "./manual-order-submit";
import { uniqueCustomers } from "./manual-customers";
import { ManualOrderService, ManualOrderError } from "./manual-order.service";
import { Router } from "express";
import { supabase } from "../database/supabase";
import { OrderRepository, OrderStatusError } from "../orders/order.repository";
import { kitchenOrder, operationalOrder } from "./order-view";

const router = Router();
router.get("/manual/capabilities", (_req,res)=>res.json({submit_enabled:process.env.MANUAL_ORDER_SUBMIT_ENABLED==="true"}));
router.post("/manual/confirm", async (req,res)=>{
  if(process.env.MANUAL_ORDER_SUBMIT_ENABLED!=="true") return res.status(503).json({message:"O envio de pedidos manuais ainda não está disponível."});
  if(!req.auth)return res.status(401).json({message:"Autenticação necessária."});
  if(req.body?.confirmed!==true)return res.status(400).json({message:"Confirme a revisão do pedido."});
  try{return res.json(await new ManualOrderSubmit(req.auth.storeId).submit(req.auth.id,req.body.request_id,req.body.order,req.body.reviewed_total));}
  catch(error){return res.status(error instanceof ManualSubmitError?error.status:error instanceof ManualOrderError?400:500).json({message:error instanceof ManualSubmitError||error instanceof ManualOrderError?error.message:"Não foi possível confirmar o pedido."});}
});

router.get("/manual/customers", async (req, res) => {
  const search = String(req.query.search || "").trim();
  if (search.length < 2) return res.json({items:[]});
  if (search.length > 100 || !/^[\p{L}\p{N} +@.-]+$/u.test(search)) return res.status(400).json({message:"Use nome ou telefone para buscar."});
  const {data,error} = await supabase.from("orders").select("customer_name,customer_phone")
    .eq("store_id",req.auth!.storeId)
    .or(`customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%`)
    .order("created_at",{ascending:false}).limit(100);
  if (error) return res.status(500).json({message:"Não foi possível buscar clientes."});
  return res.json({items:uniqueCustomers(data || []).slice(0,20)});
});

router.post("/manual/preview", async (req, res) => {
  try { return res.json({order: await new ManualOrderService(req.auth!.storeId).preview(req.body), submitted:false}); }
  catch(error) { return res.status(error instanceof ManualOrderError ? 400 : 500).json({message:error instanceof ManualOrderError ? error.message : "Não foi possível preparar o pedido."}); }
});

router.get("/kitchen", async (req, res) => {
  const {data,error}=await supabase.from("orders")
    .select("id,customer_name,delivery_type,address,status,created_at,items")
    .eq("store_id",req.auth!.storeId).order("created_at",{ascending:false});
  if(error)return res.status(500).json({message:"Não foi possível carregar a cozinha."});
  return res.json((data || []).map(kitchenOrder));
});


router.get("/", async (req, res) => {

  const { data, error } = await supabase
    .from("orders")
    .select("id,customer_name,customer_phone,total,delivery_fee,payment_method,delivery_type,address,status,created_at,items")
    .eq("store_id",req.auth!.storeId)
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(500).json({message:"Não foi possível listar os pedidos."});
  }

  res.json((data || []).map(operationalOrder));
});
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, expected_status } = req.body || {};

    const order = await new OrderRepository(req.auth!.storeId).updateStatus(
      Number(id),
      status,
      expected_status
    );

    res.json(order);

  } catch (error: any) {
    res.status(error instanceof OrderStatusError ? error.statusCode : 500).json({
      message: error instanceof OrderStatusError ? error.message : "Não foi possível atualizar o pedido."
    });
  }
});
export default router;
