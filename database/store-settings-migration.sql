-- TASK-0103–0109: configurações operacionais por loja.
BEGIN;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS payment_methods jsonb NOT NULL DEFAULT '["DINHEIRO","MULTIBANCO"]'::jsonb;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS ai_greeting text;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS ai_unknown_reply text;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS ai_personality text;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS delivery_fee_rules jsonb NOT NULL DEFAULT '[{"max_km":4,"fee":4},{"max_km":8,"fee":6},{"max_km":12,"fee":9}]'::jsonb;
CREATE UNIQUE INDEX IF NOT EXISTS settings_store_unique ON public.settings(store_id);
INSERT INTO public.settings (store_id,restaurant_name,payment_methods)
VALUES ('00000000-0000-4000-8000-000000000001','Dom Hamburgueria','["DINHEIRO","MULTIBANCO"]'::jsonb)
ON CONFLICT (store_id) DO NOTHING;
COMMIT;
