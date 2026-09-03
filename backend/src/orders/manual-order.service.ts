import { OrderService } from "./order.service";
import { isAcai } from "../products/acai-toppings";
import { pendingMenu } from "../products/menu-combos";

export class ManualOrderError extends Error {}
function requiredText(value: unknown, label: string, max: number): string {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max) throw new ManualOrderError(`${label} inválido.`);
  return value.trim();
}
function cents(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 100000 || Math.abs(value * 100 - Math.round(value * 100)) > 0.00001) throw new ManualOrderError(`${label} inválido.`);
  return Math.round(value * 100);
}

// Apenas preparação: não grava pedidos nem envia para a cozinha.
export class ManualOrderService {
  private orders: OrderService;
  constructor(storeId?: string) { this.orders = new OrderService(storeId); }
  async preview(input: any) {
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new ManualOrderError("Pedido inválido.");
    const customer_name = requiredText(input.customer_name, "Nome", 150);
    const customer_phone = requiredText(input.customer_phone, "Telefone", 20);
    if (!/^\+?[0-9 ()-]{6,20}$/.test(customer_phone)) throw new ManualOrderError("Telefone inválido.");
    if (!["DELIVERY", "PICKUP"].includes(input.delivery_type)) throw new ManualOrderError("Escolha entrega ou levantamento.");
    const address = input.delivery_type === "DELIVERY" ? requiredText(input.address, "Morada", 500) : null;
    if (!["DINHEIRO", "MULTIBANCO"].includes(input.payment_method)) throw new ManualOrderError("Escolha Dinheiro ou Multibanco.");
    // Taxa configurável fica no bloco de configurações; não aceitar taxas/preços do cliente.
    if (input.delivery_fee !== undefined && input.delivery_fee !== 0) throw new ManualOrderError("Taxa de entrega ainda não configurada. Não é possível aplicar uma taxa neste formulário.");
    if (!Array.isArray(input.items) || !input.items.length || input.items.length > 50) throw new ManualOrderError("Adicione entre 1 e 50 linhas de produtos.");
    const items = input.items.map((item: any) => {
      if (!item || typeof item !== "object" || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) throw new ManualOrderError("Quantidade inválida: use entre 1 e 99.");
      const product = requiredText(item.product, "Produto", 150);
      const notes = item.notes === undefined || item.notes === "" ? "" : requiredText(item.notes, "Observação", 500);
      return {product, quantity:item.quantity, drink:item.drink, toppings:item.toppings, notes};
    });
    let priced;
    try { priced = await this.orders.calculate(items); }
    catch (error) { throw new ManualOrderError(error instanceof Error ? error.message : "Não foi possível calcular o pedido."); }
    if (pendingMenu(priced.items)) throw new ManualOrderError("Escolha a Coca-Cola normal ou Zero de cada Menu.");
    for (const item of priced.items) if (isAcai(item.product) && item.toppings === undefined) throw new ManualOrderError("Escolha até dois toppings do açaí ou indique sem toppings.");
    const totalCents = cents(priced.total, "Total");
    const amountCents = input.payment_method === "DINHEIRO" ? cents(input.amount_paid, "Valor entregue") : null;
    if (amountCents !== null && amountCents < totalCents) throw new ManualOrderError("O valor entregue é inferior ao total.");
    return {
      customer_name, customer_phone, delivery_type:input.delivery_type, address,
      payment_method:input.payment_method, delivery_fee:0,
      amount_paid:amountCents === null ? null : amountCents/100,
      change:amountCents === null ? 0 : (amountCents-totalCents)/100,
      total:priced.total,
      items:priced.items.map((item,index)=>({...item,...(items[index].notes?{notes:items[index].notes,components:[...(item.components || []),`Observação: ${items[index].notes}`]}:{})})),
    };
  }
}
