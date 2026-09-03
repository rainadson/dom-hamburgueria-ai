import { isAcai, validateToppings } from "../products/acai-toppings";
import { menuBase, menuDrink, pendingMenu, menuBurgers } from "../products/menu-combos";
import { OrderRepository } from "./order.repository";
import { ProductRepository } from "../products/product.repository";

export class OrderService {
  private repository: OrderRepository;
  private products: ProductRepository;
  constructor(storeId?: string) { this.repository = new OrderRepository(storeId); this.products = new ProductRepository(storeId); }

  async calculate(items: any[]) {

    let totalCents = 0;
    const orderItems = [];
    for (const item of items) {
      if (!Number.isSafeInteger(item.quantity) || item.quantity <= 0) {
        throw new Error("Quantidade inválida.");
      }
      const product = await this.products.findByName(item.product);
      if (!product) throw new Error(`Produto indisponível ou ambíguo: ${item.product}`);
      const priceCents = Math.round(Number(product.price) * 100);
      const toppings = isAcai(product.name) ? validateToppings(item.toppings) : undefined;
      const base = menuBase(product.name);
      const drink = menuDrink(item.drink);
      if (base && item.drink && !drink) throw new Error("Bebida não permitida no Menu.");
      const subtotalCents = priceCents * item.quantity;
      totalCents += subtotalCents;
      orderItems.push({
        id: product.id, product: product.name, quantity: item.quantity,
        price: priceCents / 100, subtotal: subtotalCents / 100,
        ...(toppings !== undefined ? { toppings, components: [toppings.length ? `Toppings: ${toppings.join(" + ")}` : "Sem toppings"] } : {}),
        ...(base ? { drink: drink || null, components: [base, "Batata frita", drink || "Refrigerante por escolher"] } : {}),
      });
    }
    return { items: orderItems, total: totalCents / 100 };
  }

  async menuOffer(items: any[]): Promise<string | null> {
    const offers: string[] = [];
    for (const name of new Set(items.map(item => item.product))) {
      if (!menuBurgers.includes(name)) continue;
      const menu = await this.products.findByName(`Menu ${name}`);
      if (!menu || menuBase(menu.name) !== name) continue;
      const burger = items.find(item => item.product === name);
      const extra = Math.round(Number(menu.price) * 100) - Math.round(Number(burger.price) * 100);
      if (!Number.isFinite(extra) || extra < 0) continue;
      const money = (cents: number) => (cents / 100).toFixed(2).replace(".", ",");
      offers.push(`${name}: +€ ${money(extra)} por unidade (Menu por € ${money(Math.round(Number(menu.price) * 100))})`);
    }
    if (!offers.length) return null;
    return `Pode transformar em Menu, com batata frita e Coca-Cola normal ou Zero em lata:\n${offers.join("\n")}\n${offers.length === 1 ? "Deseja transformar em Menu?" : "Quais destes hambúrgueres deseja transformar em Menu?"}`;
  }

  async upgradeMenus(currentItems: any[], upgrades: any[]) {
    if (!upgrades?.length) return null;
    const remaining = currentItems.map(item => ({ ...item }));
    const menus = [];
    for (const upgrade of upgrades) {
      const product = await this.products.findByName(upgrade.product);
      const base = product && menuBase(product.name);
      if (!base || !Number.isSafeInteger(upgrade.quantity) || upgrade.quantity <= 0) return null;
      let needed = upgrade.quantity;
      for (const item of remaining) {
        if (item.product !== base) continue;
        const taken = Math.min(item.quantity, needed);
        item.quantity -= taken;
        needed -= taken;
      }
      if (needed) return null;
      menus.push({ product: product.name, quantity: upgrade.quantity, drink: upgrade.drink });
    }
    return this.calculate([...remaining.filter(item => item.quantity > 0), ...menus]);
  }

  async saveOrder(
    phone: string,
    order: any
  ) {

    if (pendingMenu(order.items)) throw new Error("Escolha o refrigerante de cada Menu antes de confirmar.");

    for (const item of order.items || []) {
      if (isAcai(item.product)) validateToppings(item.toppings);
    }

    return await this.repository.createOrder({

      customer_name:
        order.customer_name,

      customer_phone:
        phone,

      delivery_type:
        order.delivery_type,

      address:
        order.address,

      payment_method:
        order.payment_method,

      amount_paid:
        order.amount_paid,

      change:
        order.change,

      delivery_fee:
        order.delivery_fee || 0,

      total:
        order.total,

      items:
        order.items,

    });
  }

  async getOrders() {

    return await this.repository.findAll();

  }
}
