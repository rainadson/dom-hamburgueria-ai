export class ProductInputError extends Error {}
export function validateProductId(id:number) {
  if (!Number.isSafeInteger(id) || id <= 0) throw new ProductInputError("Identificador de produto inválido.");
  return id;
}
export function productInput(input:unknown, partial=false) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new ProductInputError("Produto inválido.");
  const source=input as Record<string,unknown>;
  const result:Record<string,unknown>={};
  for (const [field,max] of [["name",150],["category",100],["description",4000]] as const) {
    const value=source[field];
    if (value === undefined) { if(field === "name" && !partial) throw new ProductInputError("Informe o nome do produto."); continue; }
    if (value === null && field !== "name") { result[field]=null; continue; }
    if (typeof value !== "string" || value.length > max || (field === "name" && !value.trim())) throw new ProductInputError(`Campo ${field} inválido (máximo ${max} caracteres).`);
    result[field]=value;
  }
  if (source.price !== undefined) {
    const value=source.price;
    if ((typeof value !== "number" && typeof value !== "string") || (typeof value === "string" && !/^\d+(\.\d{1,2})?$/.test(value))) throw new ProductInputError("Preço inválido.");
    const price=Number(value), cents=Math.round(price*100);
    if (!Number.isFinite(price) || price<0 || price>99999999.99 || Math.abs(price*100-cents)>0.000001) throw new ProductInputError("Informe um preço não negativo com até duas casas decimais.");
    result.price=cents/100;
  } else if (!partial) throw new ProductInputError("Informe o preço do produto.");
  if (source.active !== undefined) {
    if (typeof source.active !== "boolean") throw new ProductInputError("Estado ativo inválido.");
    result.active=source.active;
  }
  // Ignora metadados devolvidos pelo GET, como id/created_at; não os grava novamente.
  if (!Object.keys(result).length) throw new ProductInputError("Nenhum campo de produto para atualizar.");
  return result;
}
