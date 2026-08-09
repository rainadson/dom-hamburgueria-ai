import { useEffect, useRef, useState } from "react";
import { api } from "../services/api";
import Header from "../components/Header";
import OrderTimer from "../components/OrderTimer";
import "../styles/kitchen.css";
import KitchenOrderCard from "../components/KitchenOrderCard";

const notification = new Audio("/sounds/notification.mp3");

export default function Kitchen() {

  const [orders, setOrders] = useState<any[]>([]);
  const previousOrders = useRef<number[]>([]);

  async function loadOrders() {
    try {
      const { data } = await api.get("/orders");

      const ids = data.map((o: any) => o.id);

      // Não toca na primeira carga da página
      if (
        previousOrders.current.length > 0 &&
        ids.length > previousOrders.current.length
      ) {
        notification.currentTime = 0;
        notification.play().catch(() => {
          console.log("Áudio bloqueado pelo navegador.");
        });
      }

      previousOrders.current = ids;

      setOrders(data);

    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
    }
  }

  useEffect(() => {
    loadOrders();

    const interval = setInterval(loadOrders, 3000);

    return () => clearInterval(interval);
  }, []);


  async function updateStatus(id: number, status: string) {
    try {
      await api.patch(`/orders/${id}/status`, {
        status,
      });

      loadOrders();
    } catch (error) {
      console.error(error);
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

        <div className="orders-grid">

          <div className="column">

            <h2>🟡 Pending</h2>

            {pendingOrders.map(order => (

              <KitchenOrderCard
                key={order.id}
                order={order}
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