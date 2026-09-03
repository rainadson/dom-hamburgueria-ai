export function uniqueCustomers(rows: Array<{ customer_name?: string | null; customer_phone?: string | null }>) {
  const seen = new Set<string>();
  const result: Array<{name:string;phone:string}> = [];
  for (const row of rows) {
    const phone = row.customer_phone?.trim();
    if (!phone || !/^\+?[0-9 ()-]{6,20}$/.test(phone)) continue;
    const key = phone.replace(/\D/g, "");
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({name:row.customer_name?.trim() || "",phone});
  }
  return result;
}
