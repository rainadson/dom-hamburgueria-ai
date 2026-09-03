import { requireRole } from "../middlewares/auth.middleware";
import { ProductInputError } from "./product-input";
import { Router } from "express";
import { ProductService } from "./product.service";

const router = Router();
const serviceFor = (req: any) => new ProductService(req.auth.storeId);

// Listar produtos
router.get("/", async (req, res) => {
  try {
    const products = await serviceFor(req).getProducts();
    res.json(products);
  } catch (error) {
    if (error instanceof ProductInputError) return res.status(400).json({message:error.message});
    console.error("Falha na operação de produtos.");
    res.status(500).json({ message: "Erro ao listar produtos" });
  }
});

// Buscar produto por ID
router.get("/:id", async (req, res) => {
  try {
    const product = await serviceFor(req).getProduct(Number(req.params.id));

    if (!product) {
      return res.status(404).json({
        message: "Produto não encontrado",
      });
    }

    res.json(product);
  } catch (error) {
    if (error instanceof ProductInputError) return res.status(400).json({message:error.message});
    console.error("Falha na operação de produtos.");
    res.status(500).json({ message: "Erro ao buscar produto" });
  }
});

// Criar produto
router.post("/", requireRole("ADMIN"), async (req, res) => {
  try {
    const product = await serviceFor(req).createProduct(req.body);
    res.status(201).json(product);
  } catch (error) {
    if (error instanceof ProductInputError) return res.status(400).json({message:error.message});
    console.error("Falha na operação de produtos.");
    res.status(500).json({ message: "Erro ao criar produto" });
  }
});

// Atualizar produto
router.put("/:id", requireRole("ADMIN"), async (req, res) => {
  try {
    const product = await serviceFor(req).updateProduct(
      Number(req.params.id),
      req.body
    );

    res.json(product);
  } catch (error) {
    if (error instanceof ProductInputError) return res.status(400).json({message:error.message});
    console.error("Falha na operação de produtos.");
    res.status(500).json({ message: "Erro ao atualizar produto" });
  }
});

// Excluir produto
router.delete("/:id", requireRole("ADMIN"), async (req, res) => {
  try {
    await serviceFor(req).deleteProduct(Number(req.params.id));

    res.status(204).send();
  } catch (error) {
    if (error instanceof ProductInputError) return res.status(400).json({message:error.message});
    console.error("Falha na operação de produtos.");
    res.status(500).json({ message: "Erro ao excluir produto" });
  }
});

export default router;
