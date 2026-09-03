import { useEffect, useState } from "react";
import { api } from "../services/api";
import type { Product } from "../types/product";
import "../styles/modal.css";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  product?: Product | null;
}

export default function ProductModal({
  open,
  onClose,
  onSaved,
  product,
}: Props) {
  const emptyProduct: Product = {
    name: "",
    category: "",
    description: "",
    price: 0,
    active: true,
  };

  const [form, setForm] = useState<Product>(emptyProduct);

  useEffect(() => {
    if (product) {
      setForm(product);
    } else {
      setForm(emptyProduct);
    }
  }, [product]);

  if (!open) return null;

  async function save() {
    try {
      if (product?.id) {
        await api.put(`/products/${product.id}`, form);
      } else {
        await api.post("/products", form);
      }

      onSaved();
      onClose();
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "Erro ao salvar produto.");
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{product ? "Editar Produto" : "Novo Produto"}</h2>

        <input
          placeholder="Nome"
          value={form.name}
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
        />

        <input
          placeholder="Categoria"
          value={form.category ?? ""}
          onChange={(e) =>
            setForm({ ...form, category: e.target.value })
          }
        />

        <textarea
          placeholder="Descrição"
          value={form.description ?? ""}
          onChange={(e) =>
            setForm({
              ...form,
              description: e.target.value,
            })
          }
        />

        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="Preço"
          value={form.price}
          onChange={(e) =>
            setForm({
              ...form,
              price: Number(e.target.value),
            })
          }
        />

        <label>
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) =>
              setForm({
                ...form,
                active: e.target.checked,
              })
            }
          />

          Produto Ativo
        </label>

        <div className="modal-actions">
          <button onClick={onClose}>
            Cancelar
          </button>

          <button onClick={save}>
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}