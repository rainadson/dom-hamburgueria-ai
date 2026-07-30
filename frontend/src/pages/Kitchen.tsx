import { useEffect, useState } from "react";
import { api } from "../services/api";
import Header from "../components/Header";
import "../styles/kitchen.css";

export default function Kitchen() {
  const [orders, setOrders] = useState<any[]>([]);

  async function loadOrders() {
    try {
      const { data } = await api.get("/orders");
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
        pending={orders.filter((o) => o.status === "PENDING").length}
        preparing={orders.filter((o) => o.status === "PREPARING").length}
        ready={orders.filter((o) => o.status === "READY").length}
      />

      <div className="kitchen-container">
        {orders.map((order) => (
          <div className="order-card" key={order.id}>
            <div className="order-header">
              <h2>Pedido #{order.id}</h2>
              <span className={`status ${order.status.toLowerCase()}`}>
                {order.status}
              </span>
            </div>

            <p>
              <strong>Telefone:</strong> {order.customer_phone}
            </p>

            <ul>
              {order.items.map((item: any, index: number) => (
                <li key={`${order.id}-${index}`}>
                  {item.quantity}x {item.product}
                </li>
              ))}
            </ul>

            <h3>Total € {Number(order.total).toFixed(2)}</h3>

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
    </>
  );
}