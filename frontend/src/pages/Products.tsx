import { useEffect, useState } from "react";
import { api } from "../services/api.ts";
import "../styles/admin.css";
import ProductModal from "../components/ProductModal.tsx";
import type { Product } from "../types/product.ts";

export default function Admin() {
    const [products, setProducts] = useState<Product[]>([]);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("ALL");
    const [openModal, setOpenModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    async function deleteProduct(product: Product) {

        const confirmed = window.confirm(
            `Deseja realmente excluir "${product.name}"?`
        );

        if (!confirmed) return;

        try {

            await api.delete(`/products/${product.id}`);

            loadProducts();

        } catch (error) {

            console.error(error);

            alert("Erro ao excluir produto.");

        }

    }

    async function loadProducts() {
        try {
            const { data } = await api.get("/products");
            setProducts(data);
        } catch (error) {
            console.error("Erro ao carregar produtos:", error);
        }
    }

    useEffect(() => {
        loadProducts();
    }, []);

    async function toggleProduct(product: Product) {
        try {
            await api.put(`/products/${product.id}`, {
                ...product,
                active: !product.active,
            });

            loadProducts();
        } catch (error) {
            console.error(error);
        }
    }

    const filteredProducts = products.filter((product) => {

        const matchesSearch =
            product.name.toLowerCase().includes(search.toLowerCase());

        const matchesFilter =
            filter === "ALL" ||
            (filter === "ACTIVE" && product.active) ||
            (filter === "INACTIVE" && !product.active);

        return matchesSearch && matchesFilter;

    });
    return (
        <div className="admin-container">
            <div className="admin-header">
                <h1 className="admin-title">🍔 Administração</h1>

                <button
                    className="new-button"
                    onClick={() => {
                        setSelectedProduct(null);
                        setOpenModal(true);
                    }}
                >
                    + Novo Produto
                </button>
            </div>

            <div className="search-container">
                <input
                    className="search-input"
                    placeholder="🔍 Pesquisar produto..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="filter-container">

                <select
                    className="filter-select"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                >

                    <option value="ALL">
                        Todos
                    </option>

                    <option value="ACTIVE">
                        Ativos
                    </option>

                    <option value="INACTIVE">
                        Inativos
                    </option>

                </select>

            </div>

            <div className="table-card">
                <table>
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Categoria</th>
                            <th>Preço</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>

                    <tbody>
                        {filteredProducts.map((product) => (
                            <tr key={product.id}>
                                <td>{product.name}</td>

                                <td>{product.category ?? "-"}</td>

                                <td>€ {Number(product.price).toFixed(2)}</td>

                                <td>
                                    <button
                                        className={product.active ? "status-active" : "status-inactive"}
                                        onClick={() => toggleProduct(product)}
                                    >
                                        {product.active ? "Desativar" : "Reativar"}
                                    </button>
                                </td>
                                <td>
                                    <div className="actions">

                                        <button
                                            className="edit-button"
                                            onClick={() => {
                                                setSelectedProduct(product);
                                                setOpenModal(true);
                                            }}
                                        >
                                            ✏️
                                        </button>

                                        <button
                                            className="delete-button"
                                            onClick={() => deleteProduct(product)}
                                        >
                                            🗑️
                                        </button>

                                    </div>
                                </td>

                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <ProductModal
                open={openModal}
                product={selectedProduct}
                onClose={() => setOpenModal(false)}
                onSaved={loadProducts}
            />
        </div>
    );
}