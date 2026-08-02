export interface Product {
  id?: number;
  name: string;
  description?: string;
  category: string | null;
  price: number;
  active: boolean;
}