do $$
declare
  job_name constant text := 'sobok-app-cleanup-auth-sessions';
  job_schedule constant text := '0 21 * * *';
  job_command constant text := 'select public.cleanup_auth_session_tables();';
  existing_job_id bigint;
begin
  select jobid into existing_job_id
  from cron.job
  where jobname = job_name
    and username = current_user;

  if existing_job_id is null then
    perform cron.schedule(job_name, job_schedule, job_command);
    return;
  end if;

  perform cron.alter_job(
    existing_job_id,
    schedule := job_schedule,
    command := job_command,
    database := current_database(),
    active := true
  );
end;
$$;

-- 비활성 유저 삭제는 앱 크론(apps/api)으로 이관됨 — offboarding(결제 폐기·Chat DB 파기 outbox)과
-- 세션 취소(Redis 포함)를 거쳐야 하는데 raw SQL delete로는 그 부작용을 실행할 수 없기 때문이다.
