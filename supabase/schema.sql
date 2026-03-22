-- Supabase SQL Editor에서 실행하세요.
-- Authentication > Providers 에서 Email 활성화

create extension if not exists "pgcrypto";

-- 상품
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  price integer not null check (price >= 0),
  stock integer not null default 100 check (stock >= 0),
  image_url text,
  created_at timestamptz default now()
);

alter table public.products enable row level security;

drop policy if exists "products_select_all" on public.products;
create policy "products_select_all" on public.products
  for select using (true);

-- 장바구니
create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  quantity integer not null check (quantity > 0),
  unique (user_id, product_id)
);

alter table public.cart_items enable row level security;

drop policy if exists "cart_select_own" on public.cart_items;
create policy "cart_select_own" on public.cart_items
  for select using (auth.uid() = user_id);

drop policy if exists "cart_insert_own" on public.cart_items;
create policy "cart_insert_own" on public.cart_items
  for insert with check (auth.uid() = user_id);

drop policy if exists "cart_update_own" on public.cart_items;
create policy "cart_update_own" on public.cart_items
  for update using (auth.uid() = user_id);

drop policy if exists "cart_delete_own" on public.cart_items;
create policy "cart_delete_own" on public.cart_items
  for delete using (auth.uid() = user_id);

-- 주문
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  total_amount integer not null check (total_amount >= 0),
  status text not null default 'pending',
  recipient_name text,
  address_line text,
  phone text,
  toss_payment_key text,
  created_at timestamptz default now()
);

alter table public.orders enable row level security;

drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own" on public.orders
  for select using (auth.uid() = user_id);

drop policy if exists "orders_insert_own" on public.orders;
create policy "orders_insert_own" on public.orders
  for insert with check (auth.uid() = user_id);

-- 주문 항목
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid not null references public.products (id),
  quantity integer not null check (quantity > 0),
  unit_price integer not null check (unit_price >= 0)
);

alter table public.order_items enable row level security;

drop policy if exists "order_items_select_own" on public.order_items;
create policy "order_items_select_own" on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );

drop policy if exists "order_items_insert_own" on public.order_items;
create policy "order_items_insert_own" on public.order_items
  for insert with check (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid() and o.status = 'pending'
    )
  );

-- 사용자 프로필(역할: user | admin)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'user' check (role in ('user', 'admin')),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

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

-- 시드 데이터
insert into public.products (slug, name, description, price, stock)
values
  ('cotton-tee', '오버핏 코튼 티셔츠', '부드러운 코튼.', 39000, 100),
  ('backpack', '미니멀 백팩', '가벼운 무게.', 89000, 50),
  ('tumbler', '유리 텀블러 500ml', '보온/보냉.', 24900, 80)
on conflict (slug) do nothing;
