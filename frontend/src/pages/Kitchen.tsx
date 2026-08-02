import { useEffect, useRef, useState } from "react";
import { api } from "../services/api";
import Header from "../components/Header";
import OrderTimer from "../components/OrderTimer";
import "../styles/kitchen.css";

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

          {orders.map(order => (

            <div
              key={order.id}
              className={`order-card ${order.status.toLowerCase()}`}
            >
              <div className="order-header">

                <div>

                  <h2>🍔 Pedido #{order.id}</h2>

                  <small>
                    {new Date(order.created_at).toLocaleTimeString("pt-PT")}
                  </small>

                </div>

                <div className="timer">
                  ⏱ <OrderTimer createdAt={order.created_at} />
                </div>

                <span className={`status ${order.status.toLowerCase()}`}>
                  {order.status}
                </span>

              </div>

              <p className="customer">
                📞 {order.customer_phone}
              </p>

              <ul>
                {order.items.map((item: any, index: number) => (
                  <li key={`${order.id}-${index}`}>
                    {item.quantity}x {item.product}
                  </li>
                ))}
              </ul>

              <h3 className="order-total">
                € {Number(order.total).toFixed(2)}
              </h3>

              <div className="buttons">

                {order.status === "PENDING" && (
                  <button
                    className="btn btn-yellow"
                    onClick={() => updateStatus(order.id, "PREPARING")}
                  >
                    ▶ Preparando
                  </button>
                )}

                {order.status === "PREPARING" && (
                  <button
                    className="btn btn-green"
                    onClick={() => updateStatus(order.id, "READY")}
                  >
                    ✔ Pronto
                  </button>
                )}

                {order.status === "READY" && (
                  <button
                    className="btn btn-blue"
                    onClick={() => updateStatus(order.id, "DELIVERED")}
                  >
                    🚚 Entregue
                  </button>
                )}

                {order.status === "DELIVERED" && (
                  <span className="finished">
                    ✅ Pedido Finalizado
                  </span>
                )}

              </div>

            </div>

          ))}

        </div>

      </div>

    </>
  );
}