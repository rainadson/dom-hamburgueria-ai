import { useEffect, useRef, useState } from "react";
import { api } from "../services/api";
import Header from "../components/Header";
import { createRefreshLoop } from "../services/refresh-loop";
import { createOrderArrivalTracker } from "../services/order-arrivals";
import "../styles/kitchen.css";
import KitchenOrderCard from "../components/KitchenOrderCard";

const notification = new Audio("/sounds/notification.mp3");

export default function Kitchen() {

  const [orders, setOrders] = useState<any[]>([]);
  const pendingActions = useRef(new Set<number>());
  const [updating, setUpdating] = useState<number[]>([]);
  const [actionErrors, setActionErrors] = useState<Record<number, string>>({});
  const [refreshError, setRefreshError] = useState(false);
  const refresh = useRef<() => void>(() => {});

  useEffect(() => {
    const arrivals = createOrderArrivalTracker();
    const loop = createRefreshLoop<any[]>({
      read: async (signal) => {
        const { data } = await api.get("/orders", { signal, timeout: 15000 });
        return data;
      },
      receive: (data) => {
        if (arrivals.receive(data.map(order => order.id))) {
          notification.currentTime = 0;
          notification.play().catch(() => {
            console.log("Áudio bloqueado pelo navegador.");
          });
        }
        setOrders(data);
        setRefreshError(false);
      },
      failure: () => setRefreshError(true),
      delay: 3000,
    });
    refresh.current = loop.refresh;
    const onFocus = () => { void loop.refresh(); };
    window.addEventListener("focus", onFocus);
    void loop.refresh();
    return () => {
      loop.stop();
      refresh.current = () => {};
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  async function updateStatus(id: number, status: string) {
    if (pendingActions.current.has(id)) return;
    pendingActions.current.add(id);
    setUpdating([...pendingActions.current]);
    setActionErrors(errors => ({ ...errors, [id]: "" }));
    try {
      await api.patch(`/orders/${id}/status`, { status });
    } catch {
      setActionErrors(errors => ({
        ...errors,
        [id]: "Não foi possível confirmar a alteração. Confira o estado atualizado antes de tentar novamente.",
      }));
    } finally {
      pendingActions.current.delete(id);
      setUpdating([...pendingActions.current]);
      refresh.current();
    }
  }

  const pendingOrders = orders.filter(
    order => order.status === "PENDING"
  );

  const preparingOrders = orders.filter(
    order => order.status === "PREPARING"
  );

  const readyOrders = orders.filter(
    order => order.status === "READY"
  );

  return (
    <>
      <Header
        total={orders.length}
        pending={orders.filter(o => o.status === "PENDING").length}
        preparing={orders.filter(o => o.status === "PREPARING").length}
        ready={orders.filter(o => o.status === "READY").length}
      />

      <div className="kitchen-container">
        {refreshError && <p role="status">Não foi possível atualizar a cozinha. Os pedidos podem estar desatualizados. Tentaremos novamente automaticamente.</p>}

        <div className="orders-grid">

          <div className="column">

            <h2>🟡 Pending</h2>

            {pendingOrders.map(order => (

              <KitchenOrderCard
                key={order.id}
                order={order}
                updating={updating.includes(order.id)}
                actionError={actionErrors[order.id]}
                actionLabel="▶ Preparando"
                onAction={() => updateStatus(order.id, "PREPARING")}
              />

            ))}

          </div>

          <div className="column">

            <h2>🔵 Preparing</h2>

            {preparingOrders.map(order => (

              <KitchenOrderCard
                key={order.id}
                order={order}
                updating={updating.includes(order.id)}
                actionError={actionErrors[order.id]}
                actionLabel="✔ Pronto"
                onAction={() => updateStatus(order.id, "READY")}
              />

            ))}

          </div>

          <div className="column">

            <h2>🟢 Ready</h2>

            {readyOrders.map(order => (

              <KitchenOrderCard
                key={order.id}
                order={order}
                updating={updating.includes(order.id)}
                actionError={actionErrors[order.id]}
                actionLabel="🚚 Entregue"
                onAction={() => updateStatus(order.id, "DELIVERED")}
              />

            ))}

          </div>

        </div>
      </div>

    </>
  );
}