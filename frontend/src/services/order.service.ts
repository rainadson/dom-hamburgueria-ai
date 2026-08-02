import { api } from "./api";

class OrderService {

    async getOrders() {
        const { data } = await api.get("/orders");
        return data;
    }

    async updateStatus(id: number, status: string) {
        const { data } = await api.patch(
            `/orders/${id}/status`,
            { status }
        );

        return data;
    }

}

export const orderService = new OrderService();