import { normalizeProduct } from "./menu-combos";

export const acaiToppings = ["Leite condensado", "Leite em pó", "Granola", "Paçoca", "Nutella", "Banana"];
export const isAcai = (name: string) => ["acai 350 ml", "acai m 200 ml"].includes(normalizeProduct(name));
export class InvalidToppingsError extends Error {}

export function validateToppings(value: unknown): string[] | undefined {
  // Ausência de escolhas em pedidos antigos não equivale a uma escolha inventada.
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length > 2) {
    throw new InvalidToppingsError("O açaí inclui até 2 toppings. Quais dois deseja manter?");
  }
  const toppings = value.map(name => typeof name === "string"
    ? acaiToppings.find(option => normalizeProduct(option) === normalizeProduct(name)) : undefined);
  if (toppings.some(name => !name)) {
    throw new InvalidToppingsError(`Escolha até 2 toppings entre: ${acaiToppings.join(", ")}.`);
  }
  if (new Set(toppings).size !== toppings.length) {
    throw new InvalidToppingsError("Escolha até 2 toppings diferentes para o açaí.");
  }
  return toppings as string[];
}
