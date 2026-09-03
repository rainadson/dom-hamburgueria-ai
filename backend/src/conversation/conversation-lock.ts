// Serializa o chat e as ações do painel por telefone na instância atual.
// Não substitui um bloqueio distribuído caso o serviço passe a ter réplicas.
const pending = new Map<string, Promise<void>>();
export async function withConversationLock<T>(phone: string, action: () => Promise<T>): Promise<T> {
  const previous = pending.get(phone) || Promise.resolve();
  let release!: () => void;
  const current = new Promise<void>(resolve => { release = resolve; });
  pending.set(phone, current);
  await previous;
  try { return await action(); }
  finally { release(); if (pending.get(phone) === current) pending.delete(phone); }
}
