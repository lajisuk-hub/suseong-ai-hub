-- ============================================================
-- 수성구 AI선도기관 홈페이지(suseong-ai-hub) 저장소 설정
-- Supabase 대시보드 > SQL Editor 에 전체를 붙여넣고 Run 한 번 실행
-- (멘토어린이집 홈페이지와 같은 Supabase 프로젝트에서 실행)
-- ============================================================

-- 내용 저장 테이블
create table if not exists suseong_hub_content (
  id text primary key,
  data jsonb,
  updated_at timestamptz default now()
);

alter table suseong_hub_content enable row level security;

drop policy if exists "hub read" on suseong_hub_content;
drop policy if exists "hub insert" on suseong_hub_content;
drop policy if exists "hub update" on suseong_hub_content;

create policy "hub read"   on suseong_hub_content for select using (true);
create policy "hub insert" on suseong_hub_content for insert with check (true);
create policy "hub update" on suseong_hub_content for update using (true);

-- 사진/영상 저장 공간 (public 버킷)
insert into storage.buckets (id, name, public)
values ('suseong-hub', 'suseong-hub', true)
on conflict (id) do nothing;

drop policy if exists "hub file read"   on storage.objects;
drop policy if exists "hub file upload" on storage.objects;

create policy "hub file read"   on storage.objects for select using (bucket_id = 'suseong-hub');
create policy "hub file upload" on storage.objects for insert with check (bucket_id = 'suseong-hub');
