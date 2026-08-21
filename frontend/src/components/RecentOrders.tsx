import type { Order } from "../types/order";
import "./RecentOrders.css";

interface Props {
  orders: Order[];
}

export default function RecentOrders({ orders }: Props) {
  return (
    <div className="recent-orders">

      <h2>Recent Orders</h2>

      {orders.length === 0 && (
        <p>No recent orders.</p>
      )}

      {orders.slice(0, 5).map((order) => (

        <div
          key={order.id}
          className="recent-order"
        >

          <div>

            <strong>
              #{order.id}
            </strong>

            <p>
              {order.customer_name || order.customer_phone}
            </p>

          </div>

          <span>
            € {order.total.toFixed(2)}
          </span>

        </div>

      ))}

    </div>
  );
}