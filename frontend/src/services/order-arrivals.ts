// A primeira leitura estabelece a referência, mesmo quando a lista está vazia.
export function createOrderArrivalTracker() {
  let previous: Set<string | number> | undefined;
  return {
    receive(ids: Array<string | number>) {
      const arrived = previous !== undefined && ids.some(id => !previous!.has(id));
      previous = new Set(ids);
      return arrived;
    },
  };
}
