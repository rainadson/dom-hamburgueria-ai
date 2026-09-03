import { productInput, validateProductId } from "./product-input";
import { ProductRepository } from "./product.repository";

export class ProductService {
    private repository: ProductRepository;
    constructor(storeId?: string) { this.repository = new ProductRepository(storeId); }

    async getProducts() {
    return await this.repository.findAllAdmin();
}

    async getProduct(id: number) {
        return await this.repository.findById(validateProductId(id));
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
        return await this.repository.create(productInput(product));
    }

    async updateProduct(id: number, product: any) {
        return await this.repository.update(validateProductId(id), productInput(product, true));
    }

    async deleteProduct(id: number) {
        return await this.repository.delete(validateProductId(id));
    }
}
