import { createRefreshLoop } from "../services/refresh-loop";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { orderService } from "../services/order.service";
import "../styles/orders.css";
import StatusBadge from "../components/StatusBadge";
import OrderDetailsModal from "../components/OrderDetailsModal";
import "../styles/modal.css";
import type { Order } from "../types/order";
import { connectRealtime } from "../services/realtime-refresh";


export default function Orders() {

    const [orders, setOrders] = useState<Order[]>([]);
    const [openModal, setOpenModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [search, setSearch] = useState("");

    const [refreshError, setRefreshError] = useState(false);
    const refresh = useRef<() => void>(() => {});

    useEffect(() => {
        const loop = createRefreshLoop<Order[]>({
            read: (signal) => orderService.getOrders(signal),
            receive: (data) => { setOrders(data); setRefreshError(false); },
            failure: () => setRefreshError(true),
            delay: 5000,
        });
        refresh.current = loop.refresh;
        const onFocus = () => { void loop.refresh(); };
        window.addEventListener("focus", onFocus);
        const disconnect = connectRealtime(["orders"], () => { void loop.refresh(); });
        void loop.refresh();
        return () => {
            disconnect();
            loop.stop();
            refresh.current = () => {};
            window.removeEventListener("focus", onFocus);
        };
    }, []);

    const filteredOrders = orders.filter((order) => {

        const customer = order.customer_name ?? "";
        const phone = order.customer_phone ?? "";

        return (
            customer.toLowerCase().includes(search.toLowerCase()) ||
            phone.includes(search)
        );

    });

    return (

        <div className="orders-container">

            <div className="orders-header">

                <h1>📦 Orders</h1>
                <Link to="/orders/new">Preparar pedido manual</Link>

            </div>

            <div className="search-container">

                <input
                    className="search-input"
                    placeholder="Search by customer or phone..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

            </div>

            {refreshError && <p role="status">Não foi possível atualizar os pedidos. Os dados podem estar desatualizados. Tentaremos novamente automaticamente.</p>}

            <div className="table-card">

                <table>

                    <thead>

                        <tr>

                            <th>ID</th>
                            <th>Customer</th>
                            <th>Phone</th>
                            <th>Total</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Actions</th>

                        </tr>

                    </thead>

                    <tbody>

                        {filteredOrders.map(order => (

                            <tr key={order.id}>

                                <td>#{order.id}</td>

                                <td>
                                    {order.customer_name ?? "-"}
                                </td>

                                <td>
                                    {order.customer_phone}
                                </td>

                                <td>
                                    € {Number(order.total).toFixed(2)}
                                </td>

                                <td>
                                    <StatusBadge status={order.status} />
                                </td>

                                <td>
                                    {new Date(order.created_at).toLocaleDateString()}
                                </td>
                                <td className="actions-cell">
                                    <button
                                        className="view-button"
                                        onClick={() => {
                                            setSelectedOrder(order);
                                            setOpenModal(true);
                                        }}
                                    >
                                        View
                                    </button>

                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            </div>
            <OrderDetailsModal
                open={openModal}
                order={selectedOrder}
                onClose={() => setOpenModal(false)}
                onStatusChanged={() => refresh.current()}
            />
        </div>


    );



}
