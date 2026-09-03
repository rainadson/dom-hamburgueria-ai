// Uma leitura de cada vez; pedidos de atualização durante a leitura geram nova leitura.
export function createRefreshLoop<T>(options: {
  read: (signal: AbortSignal) => Promise<T>;
  receive: (value: T) => void;
  failure: () => void;
  delay: number;
}) {
  let stopped = false;
  let running = false;
  let requested = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let controller: AbortController | undefined;
  async function refresh() {
    if (stopped) return;
    if (timer !== undefined) clearTimeout(timer);
    if (running) { requested = true; return; }
    running = true;
    controller = new AbortController();
    try {
      const value = await options.read(controller.signal);
      if (!stopped) options.receive(value);
    } catch {
      if (!stopped) options.failure();
    } finally {
      running = false;
      if (!stopped) {
        const delay = requested ? 0 : options.delay;
        requested = false;
        timer = setTimeout(refresh, delay);
      }
    }
  }
  return {
    refresh,
    stop() { stopped = true; clearTimeout(timer); controller?.abort(); },
  };
}
