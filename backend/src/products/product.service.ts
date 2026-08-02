import { ProductRepository } from "./product.repository";

export class ProductService {

    private repository = new ProductRepository();

    async getProducts() {
    return await this.repository.findAllAdmin();
}

    async getProduct(id: number) {
        return await this.repository.findById(id);
    }

    async findProduct(name: string) {
        return await this.repository.findByName(name);
    }

    async getMenuPrompt() {

        const products = await this.repository.findAll();

        return products
            .map((product: any) =>
                `• ${product.name} (€${Number(product.price).toFixed(2)}) - ${product.description}`
            )
            .join("\n");
    }
    async createProduct(product: any) {
        return await this.repository.create(product);
    }

    async updateProduct(id: number, product: any) {
        return await this.repository.update(id, product);
    }

    async deleteProduct(id: number) {
        return await this.repository.delete(id);
    }
}