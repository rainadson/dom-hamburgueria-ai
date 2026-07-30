import { Router } from "express";
import { ProductService } from "./product.service";

const router = Router();
const service = new ProductService();

router.get("/", async (req, res) => {

    const products = await service.getProducts();

    res.json(products);

});

router.get("/:id", async (req,res)=>{

    const id = Number(req.params.id);

    const product = await service.getProduct(id);

    res.json(product);

});

export default router;