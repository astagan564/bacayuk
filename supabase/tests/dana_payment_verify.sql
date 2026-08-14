select
  (select count(*) from information_schema.columns
   where table_schema = 'public'
     and table_name = 'payment_orders'
     and column_name in (
       'provider_reference_no',
       'provider_external_id',
       'provider_qr_content',
       'provider_qr_url'
     )) as dana_columns,
  (select pg_get_constraintdef(oid)
   from pg_constraint
   where conrelid = 'public.payment_orders'::regclass
     and conname = 'payment_orders_provider_check') as provider_constraint,
  to_regprocedure(
    'public.finalize_dana_payment_order(text,text,text,integer,timestamp with time zone)'
  ) is not null as function_exists,
  has_function_privilege(
    'anon',
    'public.finalize_dana_payment_order(text,text,text,integer,timestamp with time zone)',
    'EXECUTE'
  ) as anon_execute,
  has_function_privilege(
    'authenticated',
    'public.finalize_dana_payment_order(text,text,text,integer,timestamp with time zone)',
    'EXECUTE'
  ) as authenticated_execute,
  has_function_privilege(
    'service_role',
    'public.finalize_dana_payment_order(text,text,text,integer,timestamp with time zone)',
    'EXECUTE'
  ) as service_execute,
  to_regclass('public.payment_orders_dana_reference_idx') is not null as reference_index,
  to_regclass('public.payment_orders_dana_pending_idx') is not null as pending_index;
