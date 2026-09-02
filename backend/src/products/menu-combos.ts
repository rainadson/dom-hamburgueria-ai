// Composição do cardápio de 02/09/2026. Preços são sempre lidos de products.
export const menuBurgers = [
  "Dom Tradicional", "Dom Cheddar Duplo", "Dom Calabeso", "Dom Coalho",
  "Dom Chicken Bacon", "Dom Doce de Leite", "Dom X-tudo Brasil"
];
export const menuDrinks = ["Coca-Cola (lata)", "Coca-Cola Zero (lata)"];
export function normalizeProduct(value: string): string {
  return String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[-–—()]/g, " ").replace(/\s+/g, " ").trim();
}
export function menuBase(name: string): string | undefined {
  return menuBurgers.find(burger => normalizeProduct(`Menu ${burger}`) === normalizeProduct(name));
}
export function menuDrink(name: unknown): string | undefined {
  if (typeof name !== "string") return undefined;
  const normalized = normalizeProduct(name);
  const aliases: Record<string, string> = {
    "coca cola": menuDrinks[0], "coca cola normal": menuDrinks[0], "normal": menuDrinks[0],
    "coca cola zero": menuDrinks[1], "zero": menuDrinks[1],
  };
  return menuDrinks.find(drink => normalizeProduct(drink) === normalized) || aliases[normalized];
}
export function pendingMenu(items: any[] = []) {
  return items.find(item => menuBase(item.product) && !menuDrink(item.drink));
}
export function menuDrinkQuestion(items: any[] = []): string {
  const pending = pendingMenu(items);
  return `Para ${pending?.quantity || 1}x ${pending?.product || "o Menu"}, prefere Coca-Cola normal ou Zero em lata? A bebida já está incluída.`;
}
