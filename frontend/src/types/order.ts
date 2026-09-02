export interface OrderItem {
    id: number;
    product: string;
    quantity: number;
    price: number;
    subtotal: number;
    components?: string[];
    drink?: string | null;
}

export interface Order {
    id: number;
    customer_name: string | null;
    customer_phone: string;
    total: number;
    delivery_fee: number;
    payment_method: string | null;
    delivery_type: string | null;
    address: string | null;
    status: string;
    created_at: string;
    items: OrderItem[];
}