import { requireRole } from "../middlewares/auth.middleware";
import { ProductInputError } from "./product-input";
import { Router } from "express";
import { ProductService } from "./product.service";
import { positiveId } from "../middlewares/http-input";
import { reportFailure } from "../middlewares/request-context.middleware";

const router = Router();
const serviceFor = (req: any) => new ProductService(req.auth.storeId);

// Listar produtos
router.get("/", async (req, res) => {
  try {
    const products = await serviceFor(req).getProducts();
    res.json(products);
  } catch (error) {
    if (error instanceof ProductInputError) return res.status(400).json({message:error.message});
    reportFailure(res, "Falha na operação de produtos.");
    res.status(500).json({ message: "Erro ao listar produtos" });
  }
});

// Buscar produto por ID
router.get("/:id", async (req, res) => {
  try {
    const id = positiveId(req.params.id);
    if (id === null) return res.status(400).json({ message: "Identificador de produto inválido." });
    const product = await serviceFor(req).getProduct(id);

    if (!product) {
      return res.status(404).json({
        message: "Produto não encontrado",
      });
    }

    res.json(product);
  } catch (error) {
    if (error instanceof ProductInputError) return res.status(400).json({message:error.message});
    reportFailure(res, "Falha na operação de produtos.");
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
    reportFailure(res, "Falha na operação de produtos.");
    res.status(500).json({ message: "Erro ao criar produto" });
  }
});

// Atualizar produto
router.put("/:id", requireRole("ADMIN"), async (req, res) => {
  try {
    const id = positiveId(req.params.id);
    if (id === null) return res.status(400).json({ message: "Identificador de produto inválido." });
    const product = await serviceFor(req).updateProduct(
      id,
      req.body
    );

    res.json(product);
  } catch (error) {
    if (error instanceof ProductInputError) return res.status(400).json({message:error.message});
    reportFailure(res, "Falha na operação de produtos.");
    res.status(500).json({ message: "Erro ao atualizar produto" });
  }
});

// Excluir produto
router.delete("/:id", requireRole("ADMIN"), async (req, res) => {
  try {
    const id = positiveId(req.params.id);
    if (id === null) return res.status(400).json({ message: "Identificador de produto inválido." });
    await serviceFor(req).deleteProduct(id);

    res.status(204).send();
  } catch (error) {
    if (error instanceof ProductInputError) return res.status(400).json({message:error.message});
    reportFailure(res, "Falha na operação de produtos.");
    res.status(500).json({ message: "Erro ao excluir produto" });
  }
});

export default router;
