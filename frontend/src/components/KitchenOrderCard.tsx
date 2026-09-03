import { useState } from "react";
import { deliverySummary } from "../services/delivery-summary";
import OrderTimer from "./OrderTimer";
import type { KitchenOrder } from "../types/order";

interface Props {
  order: KitchenOrder;
  actionLabel: string;
  onAction: () => void;
  updating?: boolean;
  actionError?: string;
}

export default function KitchenOrderCard({
  order,
  actionLabel,
  onAction,
  updating = false,
  actionError,
}: Props) {
  const [copyMessage, setCopyMessage] = useState("");
  const [copying, setCopying] = useState(false);
  const summary = deliverySummary(order);
  async function copyDelivery() {
    if (!summary || copying) return;
    setCopying(true);
    try {
      await navigator.clipboard.writeText(summary);
      setCopyMessage("Dados copiados. Cole na conversa com o entregador. Nada foi enviado automaticamente.");
    } catch {
      setCopyMessage("Não foi possível copiar. Selecione e copie os dados exibidos no pedido.");
    } finally { setCopying(false); }
  }
  const createdAt = order.created_at.trim().replace(" ", "T");
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(createdAt);
  const createdAtLabel = new Date(
    hasTimezone ? createdAt : `${createdAt}Z`
  ).toLocaleTimeString("pt-PT");
  const isDelivery = order.delivery_type === "DELIVERY";
  const mapsUrl = order.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address)}`
    : null;

  return (
    <div className={`order-card ${order.status.toLowerCase()}`}>

      <div className="order-header">

        <div>
          <h2>🍔 Pedido #{order.id}</h2>

          <small>
            {createdAtLabel}
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
        👤 {order.customer_name?.trim() || "Cliente não identificado"}
      </p>

      <ul>
        {order.items.map((item, index) => (
          <li key={`${order.id}-${index}`}>
            {item.quantity}x {item.product}
            {item.components?.length ? <div><small>{item.components.join(" + ")}</small></div> : null}
          </li>
        ))}
      </ul>

      <section className="delivery-info" aria-label="Informações de entrega">
        <strong>{isDelivery ? "🚚 Entrega" : "🛍️ Retirada no local"}</strong>

        {isDelivery && order.address && (
          <>
            <p>{order.address}</p>
            {mapsUrl && (
              <a href={mapsUrl} target="_blank" rel="noreferrer">
                Abrir rota no mapa
              </a>
            )}
          </>
        )}
        {summary && <button type="button" disabled={copying} onClick={copyDelivery}>Copiar dados para entregador</button>}
        {copyMessage && <p role="status">{copyMessage}</p>}
      </section>

      {actionError && <p role="alert">{actionError}</p>}
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
            disabled={updating}
            onClick={onAction}
          >
            {updating ? "Atualizando…" : actionLabel}
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
