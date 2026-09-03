import { Router } from "express";
import { ProductService } from "./product.service";

const router = Router();
const service = new ProductService();

// Listar produtos
router.get("/", async (_, res) => {
  try {
    const products = await service.getProducts();
    res.json(products);
  } catch (error) {
    console.error("Falha na operação de produtos.");
    res.status(500).json({ message: "Erro ao listar produtos" });
  }
});

// Buscar produto por ID
router.get("/:id", async (req, res) => {
  try {
    const product = await service.getProduct(Number(req.params.id));

    if (!product) {
      return res.status(404).json({
        message: "Produto não encontrado",
      });
    }

    res.json(product);
  } catch (error) {
    console.error("Falha na operação de produtos.");
    res.status(500).json({ message: "Erro ao buscar produto" });
  }
});

// Criar produto
router.post("/", async (req, res) => {
  try {
    const product = await service.createProduct(req.body);
    res.status(201).json(product);
  } catch (error) {
    console.error("Falha na operação de produtos.");
    res.status(500).json({ message: "Erro ao criar produto" });
  }
});

// Atualizar produto
router.put("/:id", async (req, res) => {
  try {
    const product = await service.updateProduct(
      Number(req.params.id),
      req.body
    );

    res.json(product);
  } catch (error) {
    console.error("Falha na operação de produtos.");
    res.status(500).json({ message: "Erro ao atualizar produto" });
  }
});

// Excluir produto
router.delete("/:id", async (req, res) => {
  try {
    await service.deleteProduct(Number(req.params.id));

    res.status(204).send();
  } catch (error) {
    console.error("Falha na operação de produtos.");
    res.status(500).json({ message: "Erro ao excluir produto" });
  }
});

export default router;