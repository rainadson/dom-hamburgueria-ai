import type { Order } from "../types/order";

// Somente dados operacionais já visíveis na cozinha; sem telefone ou valores.
export function deliverySummary(order: Order): string | null {
  const address = order.address?.trim();
  if (order.delivery_type !== "DELIVERY" || !address) return null;
  const items = order.items.map(item => [
    `${item.quantity} × ${item.product}`,
    ...(item.components || []),
  ].join("\n"));
  return [
    `Dom Hamburgueria — Entrega #${order.id}`,
    `Cliente: ${order.customer_name?.trim() || "Cliente não identificado"}`,
    `Morada: ${address}`,
    "Pedido:",
    ...items,
    `Mapa: https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
  ].join("\n");
}
