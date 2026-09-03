-- PREPARAÇÃO LOCAL: não aplicada, não habilita transporte ou envio.
-- Validar em PostgreSQL de testes antes de usar em produção.
BEGIN;
CREATE TABLE IF NOT EXISTS public.whatsapp_inbox (
  event_key text PRIMARY KEY CHECK (event_key ~ '^[0-9a-f]{64}$'),
  payload jsonb NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING','PROCESSING','COMPLETED','FAILED')),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  lease_until timestamptz,
  completed_at timestamptz
);
-- Não expor payloads via acesso direto do navegador. Backend usa serviço existente.
ALTER TABLE public.whatsapp_inbox ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS whatsapp_inbox_pending_idx
  ON public.whatsapp_inbox(received_at) WHERE status = 'PENDING';
COMMIT;
