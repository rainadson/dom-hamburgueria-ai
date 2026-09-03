function kitchenItem(item: any) {
  return {
    id: item?.id,
    product: item?.product,
    quantity: item?.quantity,
    ...(Array.isArray(item?.components) ? { components: item.components } : {}),
    ...(Array.isArray(item?.toppings) ? { toppings: item.toppings } : {}),
    ...(item?.drink !== undefined ? { drink: item.drink } : {}),
  };
}

export function kitchenOrder(row: any) {
  return {
    id: row.id,
    customer_name: row.customer_name ?? null,
    delivery_type: row.delivery_type ?? null,
    address: row.address ?? null,
    status: row.status,
    created_at: row.created_at,
    items: Array.isArray(row.items) ? row.items.map(kitchenItem) : [],
  };
}

export function operationalOrder(row: any) {
  return {
    ...kitchenOrder(row),
    customer_phone: row.customer_phone,
    total: Number(row.total),
    delivery_fee: Number(row.delivery_fee || 0),
    payment_method: row.payment_method ?? null,
    items: Array.isArray(row.items) ? row.items.map((item: any) => ({
      ...kitchenItem(item),
      price: Number(item?.price),
      subtotal: Number(item?.subtotal),
    })) : [],
  };
}
