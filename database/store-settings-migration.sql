-- TASK-0103–0109: configurações operacionais por loja.
BEGIN;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS payment_methods jsonb NOT NULL DEFAULT '["DINHEIRO","MULTIBANCO"]'::jsonb;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS ai_greeting text;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS ai_unknown_reply text;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS ai_personality text;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE UNIQUE INDEX IF NOT EXISTS settings_store_unique ON public.settings(store_id);
INSERT INTO public.settings (store_id,restaurant_name,payment_methods)
VALUES ('00000000-0000-4000-8000-000000000001','Dom Hamburgueria','["DINHEIRO","MULTIBANCO"]'::jsonb)
ON CONFLICT (store_id) DO NOTHING;
COMMIT;
