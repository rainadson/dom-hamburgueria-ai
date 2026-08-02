import { useEffect, useState } from "react";
import { orderService } from "../services/order.service";
import "../styles/modal.css";
import StatusBadge from "./StatusBadge";
import type { Order } from "../types/order";

interface Props {
    open: boolean;
    order: Order | null;
    onClose: () => void;
    onStatusChanged: () => void;
}

export default function OrderDetailsModal({
    open,
    order,
    onClose,
    onStatusChanged,
}: Props) {

    const [status, setStatus] = useState("");

    useEffect(() => {
        if (order) {
            setStatus(order.status);
        }
    }, [order]);

    if (!open || !order) return null;

    async function changeStatus() {
        try {

            await orderService.updateStatus(
                order!.id,
                status
            );
            onStatusChanged();

            onClose();

        } catch (error) {

            console.error("Error updating order status:", error);

        }
    }

    return (
        <div className="modal-overlay">

            <div className="modal">

                <h2>Order #{order.id}</h2>

                <div className="order-info">

                    <div>
                        <strong>Customer</strong>
                        <p>{order.customer_name || "-"}</p>
                    </div>

                    <div>
                        <strong>Phone</strong>
                        <p>{order.customer_phone}</p>
                    </div>

                    <div>
                        <strong>Current Status</strong>
                        <StatusBadge status={order.status} />
                    </div>

                    <div>
                        <strong>Created</strong>
                        <p>
                            {new Date(order.created_at).toLocaleDateString()}
                            <br />
                            {new Date(order.created_at).toLocaleTimeString()}
                        </p>
                    </div>

                </div>

                <hr />

                <h3>Items</h3>

                <div className="items-list">

                    {order.items.map((item) => (

                        <div
                            key={item.id}
                            className="item-row"
                        >

                            <span>
                                {item.quantity} × {item.product}
                            </span>

                            <strong>
                                € {item.subtotal.toFixed(2)}
                            </strong>

                        </div>

                    ))}

                </div>

                <hr />

                <div className="totals">

                    <div>
                        <span>Delivery</span>

                        <strong>
                            € {(order.delivery_fee ?? 0).toFixed(2)}
                        </strong>
                    </div>

                    <div className="total-final">

                        <span>Total</span>

                        <strong>
                            € {order.total.toFixed(2)}
                        </strong>

                    </div>

                </div>

                <hr />

                <div className="order-info">

                    <div>
                        <strong>Payment</strong>
                        <p>{order.payment_method || "-"}</p>
                    </div>

                    <div>
                        <strong>Delivery</strong>
                        <p>{order.delivery_type || "-"}</p>
                    </div>

                    <div>
                        <strong>Address</strong>
                        <p>{order.address || "-"}</p>
                    </div>

                </div>

                <hr />

                <div className="modal-actions">

                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                    >
                        <option value="PENDING">Pending</option>
                        <option value="PREPARING">Preparing</option>
                        <option value="READY">Ready</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>

                    <button
                        className="status-button"
                        onClick={changeStatus}
                    >
                        Save Status
                    </button>

                    <button onClick={onClose}>
                        Close
                    </button>

                </div>

            </div>

        </div>
    );

}