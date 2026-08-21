import { OrderRepository } from "./order.repository";
import { ProductRepository } from "../products/product.repository";

export class OrderService {

  private repository = new OrderRepository();
  private products = new ProductRepository();

  async calculate(items: any[]) {

    let total = 0;
    const orderItems = [];

    for (const item of items) {

      console.log("================================");
      console.log("Item recebido:", item);

      const product =
        await this.products.findByName(item.product);

      console.log("Produto encontrado:", product);

      if (!product) {

        console.log("Produto NÃO encontrado");

        continue;
      }

      const subtotal =
        Number(product.price) * item.quantity;

      total += subtotal;

      orderItems.push({
        id: product.id,
        product: product.name,
        quantity: item.quantity,
        price: Number(product.price),
        subtotal
      });
    }

    return {
      items: orderItems,
      total
    };
  }

  async saveOrder(
    phone: string,
    order: any
  ) {

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