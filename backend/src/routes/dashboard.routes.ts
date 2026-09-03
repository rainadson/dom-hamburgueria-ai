import { Router } from "express";
import { supabase } from "../database/supabase";

const router = Router();

router.get("/", async (req, res) => {

    try {

        const { count: totalOrders, error: ordersError } = await supabase
            .from("orders")
            .select("*", { count: "exact", head: true }).eq("store_id",req.auth!.storeId);

        const { count: totalProducts, error: productsError } = await supabase
            .from("products")
            .select("*", { count: "exact", head: true }).eq("store_id",req.auth!.storeId);

        const { count: pendingOrders, error: pendingError } = await supabase
            .from("orders")
            .select("*", { count: "exact", head: true })
            .eq("store_id",req.auth!.storeId)
            .eq("status", "PENDING");

        if (ordersError || productsError || pendingError) throw Error("Indicadores indisponíveis.");

        const dashboard = {

            totalOrders: totalOrders ?? 0,

            totalProducts: totalProducts ?? 0,

            pendingOrders: pendingOrders ?? 0
        };

        if (req.auth?.role === "ADMIN") {
            const { data: revenueData, error: revenueError } = await supabase
                .from("orders")
                .select("total")
                .eq("store_id",req.auth!.storeId)
                .eq("status", "DELIVERED");

            if (revenueError) throw Error("Faturamento indisponível.");

            const totalRevenue =
                revenueData?.reduce(
                    (sum, order) => sum + Number(order.total), 0
                ) ?? 0;

            return res.json({ ...dashboard, totalRevenue });
        }

        res.json(dashboard);

    } catch (error: any) {

        res.status(500).json({
            message: "Não foi possível carregar os indicadores."
        });

    }

});

export default router;
