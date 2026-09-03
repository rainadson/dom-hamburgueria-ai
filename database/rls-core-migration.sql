-- TASK-0120: impede acesso direto do navegador aos dados operacionais.
-- O painel usa a API do backend; a service_role do backend ignora RLS.
BEGIN;

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'products',
    'conversations',
    'orders',
    'order_items',
    'settings',
    'user_profiles',
    'whatsapp_inbox',
    'whatsapp_messages'
  ]
  LOOP
    IF to_regclass(format('public.%I', table_name)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
      EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM anon, authenticated', table_name);
    END IF;
  END LOOP;
END;
$$;

COMMIT;
