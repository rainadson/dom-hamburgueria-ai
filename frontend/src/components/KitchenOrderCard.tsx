import OrderTimer from "./OrderTimer";
import type { Order } from "../types/order";

interface Props {
  order: Order;
  actionLabel: string;
  onAction: () => void;
}

export default function KitchenOrderCard({
  order,
  actionLabel,
  onAction,
}: Props) {
  return (
    <div className={`order-card ${order.status.toLowerCase()}`}>

      <div className="order-header">

        <div>
          <h2>🍔 Pedido #{order.id}</h2>

          <small>
            {new Date(
              `${order.created_at.replace(" ", "T")}Z`
            ).toLocaleTimeString("pt-PT")}
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
        {order.items.map((item, index) => (
          <li key={`${order.id}-${index}`}>
            {item.quantity}x {item.product}
          </li>
        ))}
      </ul>

      <h3 className="order-total">
        € {Number(order.total).toFixed(2)}
      </h3>

      <div className="buttons">

        {actionLabel ? (
          <button
            className={
              order.status === "PENDING"
                ? "btn btn-yellow"
                : order.status === "PREPARING"
                  ? "btn btn-green"
                  : "btn btn-blue"
            }
            onClick={onAction}
          >
            {actionLabel}
          </button>
        ) : (
          <span className="finished">
            ✅ Pedido Finalizado
          </span>
        )}

      </div>

    </div>
  );
}