-- 기존에 schema.sql만 실행한 DB에 적용할 때: Supabase SQL Editor에서 순서대로 실행

-- 1) 상품 재고
alter table public.products add column if not exists stock integer not null default 100
  check (stock >= 0);

update public.products set stock = 100 where stock is null;

-- 2) 프로필(역할)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'user' check (role in ('user', 'admin')),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

-- 기존 가입자에게 프로필 행 보강
insert into public.profiles (id, role)
select u.id, 'user' from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

-- 3) 신규 가입 시 프로필 자동 생성
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role) values (new.id, 'user')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4) 결제 완료 시 재고 차감 (원자적)
create or replace function public.finalize_order_stock(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  for r in
    select product_id, quantity from public.order_items where order_id = p_order_id
  loop
    update public.products
    set stock = stock - r.quantity
    where id = r.product_id and stock >= r.quantity;
    if not found then
      raise exception 'insufficient_stock:%', r.product_id using errcode = 'P0001';
    end if;
  end loop;
end;
$$;

grant execute on function public.finalize_order_stock(uuid) to service_role;

create or replace function public.complete_order_after_payment(p_order_id uuid, p_payment_key text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.finalize_order_stock(p_order_id);
  update public.orders
    set status = 'paid', toss_payment_key = p_payment_key
  where id = p_order_id and status = 'pending';
  if not found then
    raise exception 'order_not_pending';
  end if;
end;
$$;

grant execute on function public.complete_order_after_payment(uuid, text) to service_role;

-- 5) 관리자 지정 예시 (이메일을 본인 계정으로 바꾼 뒤 실행)
-- update public.profiles set role = 'admin'
-- where id = (select id from auth.users where email = 'you@example.com' limit 1);
