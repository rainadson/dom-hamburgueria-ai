import { handleApiError } from "./middlewares/error.middleware";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import productRoutes from "./products/product.routes";
import aiRoutes from "./routes/ai.routes";
import orderRoutes from "./orders/order.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import { requireAuth } from "./middlewares/auth.middleware";
import { apiNotFound } from "./middlewares/not-found.middleware";
import { requestContext } from "./middlewares/request-context.middleware";

import conversationRoutes from "./conversation/conversation.routes";

import whatsappStatusRoutes from "./whatsapp/whatsapp-status.routes";
import realtimeRoutes from "./realtime/realtime.routes";
import settingsRoutes from "./settings/settings.routes";

const app = express();

app.use(requestContext);
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.json({ status: "ok" });
});

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Dom Hamburgueria AI API Online 🚀",
  });
});

app.get("/api/session", requireAuth, (req, res) => res.json({
  id: req.auth!.profileId,
  user_id: req.auth!.id,
  name: req.auth!.name,
  role: req.auth!.role,
  store_id: req.auth!.storeId,
}));


app.use("/api/whatsapp", requireAuth, whatsappStatusRoutes);
app.use("/api/realtime", requireAuth, realtimeRoutes);
app.use("/api/settings", requireAuth, settingsRoutes);
app.use("/api/conversations", requireAuth, conversationRoutes);
app.use("/api/orders", requireAuth, orderRoutes);
app.use("/api/chat", requireAuth);
app.use("/api", aiRoutes);
app.use("/api/products", requireAuth, productRoutes);
app.use("/api/dashboard", requireAuth, dashboardRoutes);
app.use("/api", apiNotFound);
app.use(handleApiError);
export default app;
