import { Router } from "express";
import { supabase } from "../database/supabase";

const router = Router();

router.get("/test-db", async (req, res) => {
  const { data, error } = await supabase
    .from("products")
    .select("*");

  if (error) {
    return res.status(500).json({message:"Não foi possível consultar os produtos."});
  }

  return res.json(data);
});

export default router;