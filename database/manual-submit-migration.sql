-- TASK-0081: preparação local; NÃO aplicada em produção.
-- Executar antes de habilitar MANUAL_ORDER_SUBMIT_ENABLED.
-- Adição compatível com pedidos existentes, sem mudar políticas ou permissões.
BEGIN;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS manual_request_id uuid;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS manual_actor_id uuid;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS manual_payload_hash text;
CREATE UNIQUE INDEX IF NOT EXISTS orders_manual_actor_request_unique
  ON public.orders (manual_actor_id, manual_request_id)
  WHERE manual_request_id IS NOT NULL;
COMMIT;
