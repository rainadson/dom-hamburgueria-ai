import { normalizeProduct } from "./menu-combos";
import { supabase } from "../database/supabase";
import { DOM_STORE_ID } from "../database/store-context";

export class ProductRepository {
  constructor(private storeId = DOM_STORE_ID) {}

  async findAll() {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("store_id", this.storeId)
      .eq("active", true)
      .order("name");

    if (error) throw error;

    return data;
  }

  async findById(id: number) {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("store_id", this.storeId)
      .eq("id", id)
      .single();

    if (error) throw error;

    return data;
  }

  async findByName(name: string) {

    const { data, error } = await supabase.from("products").select("*").eq("store_id", this.storeId).eq("active", true);
    if (error) throw error;
    const aliases: Record<string, string> = {
      "coca cola": "Coca-Cola (lata)",
      "coca cola zero": "Coca-Cola Zero (lata)",
      "coca cola de 1l": "Coca-Cola 1 L"
    };
    const search = normalizeProduct(aliases[normalizeProduct(name)] || name);
    if (!search) return null;
    const exact = data.find((p: any) => normalizeProduct(p.name) === search);
    if (exact) return exact;
    // Uma busca parcial nunca pode confundir um hambúrguer com seu Menu.
    const matches = data.filter((p: any) => normalizeProduct(p.name).includes(search));
    return matches.length === 1 ? matches[0] : null;
  }

  async create(product: any) {

    const { data, error } = await supabase
      .from("products")
      .insert({...product, store_id: this.storeId})
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  async update(id: number, product: any) {

    const { data, error } = await supabase
      .from("products")
      .update(product)
      .eq("store_id", this.storeId)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  async delete(id: number) {

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("store_id", this.storeId)
      .eq("id", id);

    if (error) throw error;
  }
  async findAllAdmin() {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("store_id", this.storeId)
      .order("name");

    if (error) throw error;

    return data;
  }
}
