import { Router } from "express";
import { realtimeEvents, type RealtimeTopic } from "./realtime-events";

const router = Router();
const allowed = new Set<RealtimeTopic>(["orders", "conversations"]);

router.get("/", (req, res) => {
  const topics = String(req.query.topics || "").split(",").filter((topic): topic is RealtimeTopic => allowed.has(topic as RealtimeTopic));
  if (!topics.length || !req.auth) return res.status(400).json({ message: "Canal de atualização inválido." });
  res.status(200).set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders();
  res.write("event: ready\ndata: {}\n\n");
  const unsubscribe = realtimeEvents.subscribe(req.auth.storeId, [...new Set(topics)], topic => {
    res.write(`event: change\ndata: ${JSON.stringify({ topic })}\n\n`);
  });
  const heartbeat = setInterval(() => res.write(": keep-alive\n\n"), 20_000);
  req.on("close", () => { clearInterval(heartbeat); unsubscribe(); });
});

export default router;
