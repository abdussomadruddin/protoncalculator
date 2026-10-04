begin;
drop trigger if exists car_delivery_admin_live on public.car_push_deliveries;
create trigger car_delivery_admin_live after insert or update or delete on public.car_push_deliveries
for each statement execute function public.car_emit_live_signal('admin');
commit;
