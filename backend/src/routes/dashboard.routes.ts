import { Router } from "express";
import { supabase } from "../database/supabase";

const router = Router();

router.get("/", async (_, res) => {

    try {

        const { count: totalOrders } = await supabase
            .from("orders")
            .select("*", { count: "exact", head: true });

        const { count: totalProducts } = await supabase
            .from("products")
            .select("*", { count: "exact", head: true });

        const { count: pendingOrders } = await supabase
            .from("orders")
            .select("*", { count: "exact", head: true })
            .eq("status", "PENDING");

        const { data: revenueData } = await supabase
            .from("orders")
            .select("total")
            .eq("status", "DELIVERED");

        const totalRevenue =
            revenueData?.reduce(
                (sum, order) => sum + Number(order.total),
                0
            ) ?? 0;

        res.json({

            totalOrders: totalOrders ?? 0,

            totalProducts: totalProducts ?? 0,

            pendingOrders: pendingOrders ?? 0,

            totalRevenue

        });

    } catch (error: any) {

        res.status(500).json({
            message: error.message
        });

    }

});

export default router;