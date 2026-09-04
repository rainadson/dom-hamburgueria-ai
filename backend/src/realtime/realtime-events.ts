import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../database/supabase";

export type RealtimeTopic = "orders" | "conversations";
type Listener = { topics: Set<RealtimeTopic>; notify: (topic: RealtimeTopic) => void };
type StoreChannel = { channel: RealtimeChannel; listeners: Set<Listener> };

export class RealtimeEvents {
  private readonly stores = new Map<string, StoreChannel>();

  subscribe(storeId: string, topics: RealtimeTopic[], notify: Listener["notify"]) {
    let store = this.stores.get(storeId);
    if (!store) {
      const listeners = new Set<Listener>();
      const emit = (topic: RealtimeTopic) => {
        for (const listener of listeners) if (listener.topics.has(topic)) listener.notify(topic);
      };
      const channel = supabase.channel(`panel:${storeId}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `store_id=eq.${storeId}` }, () => emit("orders"))
        .on("postgres_changes", { event: "*", schema: "public", table: "conversations", filter: `store_id=eq.${storeId}` }, () => emit("conversations"))
        .subscribe();
      store = { channel, listeners };
      this.stores.set(storeId, store);
    }
    const listener: Listener = { topics: new Set(topics), notify };
    store.listeners.add(listener);
    return () => {
      store!.listeners.delete(listener);
      if (!store!.listeners.size) {
        this.stores.delete(storeId);
        void supabase.removeChannel(store!.channel);
      }
    };
  }
}

export const realtimeEvents = new RealtimeEvents();
