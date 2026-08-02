import { supabase } from "../database/supabase";

export class ProductRepository {

  async findAll() {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("active", true)
      .order("name");

    if (error) throw error;

    return data;
  }

  async findById(id: number) {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    return data;
  }

  async findByName(name: string) {

    const search = name
      .toLowerCase()
      .replace(/[-–—]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const { data, error } = await supabase
      .from("products")
      .select("*");

    if (error) throw error;

    console.log("Produtos do banco:");
    console.log(data);

    const product = data.find((p: any) => {

      const productName = p.name
        .toLowerCase()
        .replace(/[-–—]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      console.log(`Comparando "${productName}" com "${search}"`);

      return (
        productName === search ||
        productName.includes(search) ||
        search.includes(productName)
      );
    });

    console.log("Encontrado:", product);

    return product || null;
  }

  async create(product: any) {

    const { data, error } = await supabase
      .from("products")
      .insert(product)
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  async update(id: number, product: any) {

    const { data, error } = await supabase
      .from("products")
      .update(product)
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
      .eq("id", id);

    if (error) throw error;
  }
  async findAllAdmin() {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("name");

    if (error) throw error;

    return data;
  }
}