alter table public.payment_orders
  add column whatsapp_notification_status text not null default 'not_requested',
  add column whatsapp_notification_attempts integer not null default 0,
  add column whatsapp_notification_sent_at timestamptz,
  add column whatsapp_notification_message_id text,
  add column whatsapp_notification_error text;

alter table public.payment_orders
  add constraint payment_orders_whatsapp_notification_status_check check (
    whatsapp_notification_status in (
      'not_requested',
      'pending',
      'sending',
      'sent',
      'failed',
      'skipped'
    )
  ),
  add constraint payment_orders_whatsapp_notification_attempts_check check (
    whatsapp_notification_attempts >= 0
  );

comment on column public.payment_orders.whatsapp_notification_status is
  'Delivery state for the admin payment-review WhatsApp template.';
