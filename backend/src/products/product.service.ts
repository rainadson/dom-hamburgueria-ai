import { ProductRepository } from "./product.repository";

export class ProductService {

    private repository = new ProductRepository();

    async getProducts() {
        return await this.repository.findAll();
    }

    async getProduct(id:number){
        return await this.repository.findById(id);
    }

}