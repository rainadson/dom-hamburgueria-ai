import { Router } from "express";
import { supabase } from "../database/supabase";
import { OrderRepository } from "../orders/order.repository";

const repository = new OrderRepository();

const router = Router();

router.get("/", async (req, res) => {

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(500).json(error);
  }

  res.json(data);
});
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await repository.updateStatus(
      Number(id),
      status
    );

    res.json(order);

  } catch (error: any) {
    res.status(500).json({
      message: error.message
    });
  }
});
export default router;