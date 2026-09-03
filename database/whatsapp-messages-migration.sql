-- PROPOSTA LOCAL: não aplicada. Requer whatsapp-inbox-migration.sql.
-- Rever permissões e validar numa base de testes antes de ativar.
BEGIN;
CREATE TABLE public.whatsapp_messages (
  message_key text PRIMARY KEY,
  message jsonb NOT NULL CHECK (jsonb_typeof(message) = 'object'),
  source_event_key text NOT NULL REFERENCES public.whatsapp_inbox(event_key),
  received_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL CHECK (status IN ('PENDING', 'UNSUPPORTED', 'COMPLETED'))
);
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Bloqueia o envelope e grava o lote inteiro numa transação. Não executa pedidos.
-- SECURITY INVOKER: não concede acesso elevado ao chamador.
CREATE FUNCTION public.store_whatsapp_messages(p_event_key text, p_messages jsonb)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE
  item jsonb;
  existing_message jsonb;
BEGIN
  IF jsonb_typeof(p_messages) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Invalid message batch';
  END IF;
  PERFORM 1 FROM public.whatsapp_inbox WHERE event_key = p_event_key FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Inbox envelope missing'; END IF;
  -- Ordem estável reduz deadlocks entre envelopes com mensagens sobrepostas.
  FOR item IN SELECT value FROM jsonb_array_elements(p_messages) ORDER BY value->>'key'
  LOOP
    IF jsonb_typeof(item->'key') IS DISTINCT FROM 'string'
       OR length(item->>'key') = 0
       OR jsonb_typeof(item->'processable') IS DISTINCT FROM 'boolean' THEN
      RAISE EXCEPTION 'Invalid normalized message';
    END IF;
    INSERT INTO public.whatsapp_messages(message_key,message,source_event_key,status)
      VALUES(item->>'key',item,p_event_key,
        CASE WHEN (item->>'processable')::boolean THEN 'PENDING' ELSE 'UNSUPPORTED' END)
      ON CONFLICT(message_key) DO NOTHING;
    SELECT message INTO existing_message FROM public.whatsapp_messages
      WHERE message_key = item->>'key';
    IF existing_message IS DISTINCT FROM item THEN
      RAISE EXCEPTION 'Conflicting message identity';
    END IF;
  END LOOP;
  -- COMPLETED aqui significa extração durável; as mensagens têm estado separado.
  UPDATE public.whatsapp_inbox SET status='COMPLETED',completed_at=now(),lease_until=NULL
    WHERE event_key=p_event_key;
END;
$$;
REVOKE ALL ON FUNCTION public.store_whatsapp_messages(text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.store_whatsapp_messages(text,jsonb) TO service_role;
COMMIT;
