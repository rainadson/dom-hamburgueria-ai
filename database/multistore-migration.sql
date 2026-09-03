-- TASK-0121: associa todos os dados e utilizadores a uma loja.
-- A instalação existente é vinculada à Dom Hamburgueria.
BEGIN;

CREATE TABLE IF NOT EXISTS public.stores (
  id uuid PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.stores (id, slug, name)
VALUES ('00000000-0000-4000-8000-000000000001', 'dom-hamburgueria', 'Dom Hamburgueria')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name;

DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['products','conversations','orders','order_items','settings','user_profiles']
  LOOP
    IF to_regclass(format('public.%I', table_name)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS store_id uuid', table_name);
      EXECUTE format('UPDATE public.%I SET store_id=$1 WHERE store_id IS NULL', table_name)
        USING '00000000-0000-4000-8000-000000000001'::uuid;
      EXECUTE format('ALTER TABLE public.%I ALTER COLUMN store_id SET NOT NULL', table_name);
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid=format('public.%I',table_name)::regclass AND conname=table_name || '_store_id_fkey') THEN
        EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (store_id) REFERENCES public.stores(id)', table_name, table_name || '_store_id_fkey');
      END IF;
      EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I(store_id)', table_name || '_store_id_idx', table_name);
    END IF;
  END LOOP;
END;
$$;

ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_phone_key;
CREATE UNIQUE INDEX IF NOT EXISTS conversations_store_phone_unique ON public.conversations(store_id, phone);

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.stores FROM anon, authenticated;

COMMIT;
