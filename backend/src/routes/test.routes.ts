import { Router } from "express";
import { supabase } from "../database/supabase";

const router = Router();

router.get("/test-db", async (req, res) => {
  const { data, error } = await supabase
    .from("products")
    .select("*");

  if (error) {
    return res.status(500).json(error);
  }

  return res.json(data);
});

export default router;