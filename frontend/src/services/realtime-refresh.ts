import { apiBaseUrl } from "./api";
import { supabase } from "../lib/supabase";

export type RealtimeTopic = "orders" | "conversations";

export function connectRealtime(topics: RealtimeTopic[], onChange: (topic: RealtimeTopic) => void) {
  let stopped = false;
  let controller: AbortController | undefined;
  let retry: ReturnType<typeof setTimeout> | undefined;
  async function connect() {
    if (stopped) return;
    controller = new AbortController();
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw Error("missing session");
      const response = await fetch(`${apiBaseUrl}/realtime?topics=${encodeURIComponent(topics.join(","))}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "text/event-stream" },
        signal: controller.signal,
      });
      if (!response.ok || !response.body) throw Error("realtime unavailable");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (!stopped) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split("\n\n");
        buffer = frames.pop() || "";
        for (const frame of frames) {
          if (!frame.includes("event: change")) continue;
          const line = frame.split("\n").find(item => item.startsWith("data: "));
          if (!line) continue;
          try {
            const topic = JSON.parse(line.slice(6)).topic;
            if (topics.includes(topic)) onChange(topic);
          } catch { /* evento incompleto: aguardar o próximo */ }
        }
      }
    } catch (error) {
      if (stopped || (error instanceof DOMException && error.name === "AbortError")) return;
    }
    if (!stopped) retry = setTimeout(connect, 5000);
  }
  void connect();
  return () => { stopped = true; clearTimeout(retry); controller?.abort(); };
}
