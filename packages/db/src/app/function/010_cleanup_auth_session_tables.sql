create or replace function public.cleanup_auth_session_tables () returns void language plpgsql security definer
set
  search_path = '' as $function$
begin
  delete from public.session
  where expires_at <= now();

  delete from public.verification
  where expires_at <= now();
end;
$function$;
