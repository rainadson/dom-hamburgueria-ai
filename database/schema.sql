-- Produtos
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    price NUMERIC(10,2) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Conversas
CREATE TABLE conversations (
    id BIGSERIAL PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,
    customer_name VARCHAR(150),
    state VARCHAR(50) NOT NULL DEFAULT 'GREETING',
    history JSONB DEFAULT '[]',
    order_draft JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Pedidos
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    customer_name VARCHAR(150),
    customer_phone VARCHAR(20),
    delivery_type VARCHAR(20),
    address TEXT,
    payment_method VARCHAR(50),
    delivery_fee NUMERIC(10,2) DEFAULT 0,
    total NUMERIC(10,2) DEFAULT 0,
    status VARCHAR(30) DEFAULT 'NEW',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Itens do Pedido
CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
    product_name VARCHAR(150),
    quantity INTEGER,
    unit_price NUMERIC(10,2),
    notes TEXT
);

-- Configurações
CREATE TABLE settings (
    id BIGSERIAL PRIMARY KEY,
    restaurant_name VARCHAR(150),
    phone VARCHAR(20),
    address TEXT,
    opening_hours TEXT,
    delivery_fee NUMERIC(10,2),
    pix_key TEXT
);