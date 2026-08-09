import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import testRoutes from "./routes/test.routes";
import productRoutes from "./products/product.routes";
import webhookRoutes from "./whatsapp/webhook.routes";
import aiRoutes from "./routes/ai.routes";
import orderRoutes from "./orders/order.routes";
import dashboardRoutes from "./routes/dashboard.routes";

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Dom Hamburgueria AI API Online 🚀",
  });
});


app.use("/api/orders", orderRoutes);
app.use("/api", aiRoutes);
app.use("/api", testRoutes);
app.use("/api/products", productRoutes);
app.use("/api", webhookRoutes);
app.use("/dashboard", dashboardRoutes);
export default app;