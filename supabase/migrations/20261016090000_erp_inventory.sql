-- =============================================================================
-- RADIX ERP — Migration 9: inventory (electronics kits and components)
-- =============================================================================
-- Super Admin only. Access is tied to the platform-wide `super_admin` ROLE,
-- not to the `inventory.manage` permission, so granting another role that
-- permission (or re-running the RBAC seed) can never open inventory to it.
--
-- Stock levels are a ledger: `inventory_items.quantity_on_hand` is changed
-- only by the definer functions below, and every change writes an append-only
-- `inventory_movements` row with the resulting balance. Items, categories and
-- kit contents are audited by the generic audit trigger.
-- =============================================================================

create or replace function erp_private.is_super_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.user_role_assignments a
    join public.profiles pr on pr.id = a.user_id
    where a.user_id = auth.uid()
      and a.institution_id is null
      and a.role_key = 'super_admin'
      and pr.is_active
  )
$$;
grant execute on function erp_private.is_super_admin() to authenticated;

create or replace function erp_private.require_super_admin()
returns uuid language plpgsql stable set search_path = '' as $$
declare v uuid := erp_private.require_user();
begin
  if not erp_private.is_super_admin() then
    raise exception 'Inventory is restricted to Super Admins' using errcode = '42501';
  end if;
  return v;
end $$;

-- Inventory is Super Admin only: take the permission away from every other role.
delete from public.role_permissions where permission_key = 'inventory.manage' and role_key <> 'super_admin';
update public.roles set description = 'Reserved. Inventory is currently restricted to Super Admins'
where key = 'inventory_manager';

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------
create type public.inventory_item_kind as enum ('component', 'kit');
create type public.inventory_movement_type as enum
  ('receive', 'issue', 'return', 'adjust', 'write_off', 'assemble', 'disassemble');

create table public.inventory_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (length(trim(name)) between 1 and 80),
  description text check (description is null or length(description) <= 300),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create unique index inventory_categories_name_key on public.inventory_categories (lower(name));
create trigger inventory_categories_touch before update on public.inventory_categories
  for each row execute function erp_private.touch_updated_at();

create table public.inventory_items (
  id               uuid primary key default gen_random_uuid(),
  sku              text not null check (sku ~ '^[A-Z0-9][A-Z0-9._-]{1,39}$'),
  name             text not null check (length(trim(name)) between 2 and 200),
  kind             public.inventory_item_kind not null default 'component',
  category_id      uuid references public.inventory_categories(id) on delete set null,
  unit             text not null default 'pcs' check (length(trim(unit)) between 1 and 20),
  description      text check (description is null or length(description) <= 2000),
  manufacturer     text check (manufacturer is null or length(manufacturer) <= 120),
  storage_location text check (storage_location is null or length(storage_location) <= 120),
  unit_cost        numeric(12, 2) check (unit_cost is null or unit_cost >= 0),
  reorder_level    integer not null default 0 check (reorder_level between 0 and 1000000),
  quantity_on_hand integer not null default 0 check (quantity_on_hand >= 0),
  is_active        boolean not null default true,
  created_by       uuid references auth.users(id) on delete set null default auth.uid(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create unique index inventory_items_sku_key on public.inventory_items (sku);
create index inventory_items_category_idx on public.inventory_items (category_id);
create trigger inventory_items_touch before update on public.inventory_items
  for each row execute function erp_private.touch_updated_at();

-- Bill of materials: which components (and how many) make up one kit.
create table public.inventory_kit_components (
  id           uuid primary key default gen_random_uuid(),
  kit_id       uuid not null references public.inventory_items(id) on delete cascade,
  component_id uuid not null references public.inventory_items(id) on delete restrict,
  quantity     integer not null check (quantity between 1 and 100000),
  unique (kit_id, component_id),
  check (kit_id <> component_id)
);
create index inventory_kit_components_component_idx on public.inventory_kit_components (component_id);

create or replace function erp_private.check_kit_component()
returns trigger language plpgsql set search_path = '' as $$
begin
  if (select kind from public.inventory_items where id = new.kit_id) <> 'kit' then
    raise exception 'Only kits can have components' using errcode = '23514';
  end if;
  if (select kind from public.inventory_items where id = new.component_id) <> 'component' then
    raise exception 'A kit can only contain components, not other kits' using errcode = '23514';
  end if;
  return new;
end $$;
create trigger inventory_kit_components_check before insert or update on public.inventory_kit_components
  for each row execute function erp_private.check_kit_component();

-- An item that is part of a kit (or has components) cannot switch kind.
create or replace function erp_private.check_item_kind_change()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.kind <> old.kind and exists (
    select 1 from public.inventory_kit_components where kit_id = new.id or component_id = new.id
  ) then
    raise exception 'Remove this item from kit contents before changing its type' using errcode = '23514';
  end if;
  return new;
end $$;
create trigger inventory_items_kind_check before update of kind on public.inventory_items
  for each row execute function erp_private.check_item_kind_change();

create table public.inventory_movements (
  id              bigint generated always as identity primary key,
  item_id         uuid not null references public.inventory_items(id) on delete restrict,
  movement_type   public.inventory_movement_type not null,
  quantity_change integer not null check (quantity_change <> 0),
  balance_after   integer not null check (balance_after >= 0),
  institution_id  uuid references public.institutions(id) on delete restrict,
  issued_to       text check (issued_to is null or length(issued_to) <= 150),
  reference       text check (reference is null or length(reference) <= 120),
  note            text check (note is null or length(note) <= 500),
  batch_id        uuid,  -- groups the rows of one assemble/disassemble
  created_by      uuid references auth.users(id) on delete set null,
  occurred_at     timestamptz not null default now()
);
create index inventory_movements_item_idx on public.inventory_movements (item_id, occurred_at desc);
create index inventory_movements_time_idx on public.inventory_movements (occurred_at desc);
create index inventory_movements_inst_idx on public.inventory_movements (institution_id) where institution_id is not null;

create trigger audit_inventory_categories after insert or update or delete on public.inventory_categories
  for each row execute function erp_private.audit_row_change();
create trigger audit_inventory_items after insert or update or delete on public.inventory_items
  for each row execute function erp_private.audit_row_change();
create trigger audit_inventory_kit_components after insert or update or delete on public.inventory_kit_components
  for each row execute function erp_private.audit_row_change();

-- -----------------------------------------------------------------------------
-- Grants and RLS
-- -----------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['inventory_categories', 'inventory_items', 'inventory_kit_components', 'inventory_movements'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon, authenticated', t);
    execute format('grant select on table public.%I to authenticated', t);
    execute format('grant all on table public.%I to service_role', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using ((select erp_private.is_super_admin())) with check ((select erp_private.is_super_admin()))',
      t || '_super_admin', t);
  end loop;
end $$;

grant insert, update, delete on public.inventory_categories to authenticated;
grant insert, update, delete on public.inventory_kit_components to authenticated;
-- quantity_on_hand is deliberately absent: stock only changes through movements.
grant insert (sku, name, kind, category_id, unit, description, manufacturer, storage_location, unit_cost, reorder_level, is_active)
  on public.inventory_items to authenticated;
grant update (sku, name, kind, category_id, unit, description, manufacturer, storage_location, unit_cost, reorder_level, is_active)
  on public.inventory_items to authenticated;
grant delete on public.inventory_items to authenticated;
-- inventory_movements: select only (append-only ledger written by functions).

-- -----------------------------------------------------------------------------
-- Functions
-- -----------------------------------------------------------------------------

-- Units of an item currently out with an institution (issued − returned).
create or replace function erp_private.inventory_outstanding(p_item uuid, p_institution uuid)
returns integer language sql stable set search_path = '' as $$
  select coalesce(-sum(quantity_change), 0)::integer
  from public.inventory_movements
  where item_id = p_item and institution_id = p_institution and movement_type in ('issue', 'return')
$$;

-- Record a stock movement. p_quantity is always positive, except for 'adjust',
-- where it is the counted quantity now on the shelf.
create or replace function public.erp_inventory_move(
  p_item uuid,
  p_type public.inventory_movement_type,
  p_quantity integer,
  p_institution uuid default null,
  p_issued_to text default null,
  p_reference text default null,
  p_note text default null
) returns bigint language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := erp_private.require_super_admin();
  v_on_hand integer;
  v_change integer;
  v_id bigint;
begin
  if p_type in ('assemble', 'disassemble') then
    raise exception 'Use assemble or disassemble for kit builds' using errcode = '22023';
  end if;
  if p_quantity is null or p_quantity < 0 or (p_type <> 'adjust' and p_quantity = 0) or p_quantity > 1000000 then
    raise exception 'Enter a quantity greater than zero' using errcode = '22023';
  end if;
  p_issued_to := nullif(trim(p_issued_to), '');
  if p_type in ('issue', 'return') then
    if p_institution is null and p_issued_to is null then
      raise exception 'Choose the school or centre, or say who it is for' using errcode = '22023';
    end if;
  elsif p_institution is not null or p_issued_to is not null then
    raise exception 'Only issues and returns go to a school, centre or person' using errcode = '22023';
  end if;
  if p_type in ('adjust', 'write_off') and coalesce(trim(p_note), '') = '' then
    raise exception 'Give a reason for adjustments and write-offs' using errcode = '22023';
  end if;
  if p_institution is not null and not exists (select 1 from public.institutions where id = p_institution) then
    raise exception 'Institution not found' using errcode = 'P0002';
  end if;

  select quantity_on_hand into v_on_hand from public.inventory_items where id = p_item for update;
  if not found then
    raise exception 'Item not found' using errcode = 'P0002';
  end if;

  v_change := case p_type
    when 'receive'   then p_quantity
    when 'return'    then p_quantity
    when 'issue'     then -p_quantity
    when 'write_off' then -p_quantity
    when 'adjust'    then p_quantity - v_on_hand
  end;
  if v_change = 0 then
    raise exception 'The counted quantity matches the current stock; nothing to adjust' using errcode = '22023';
  end if;
  if v_on_hand + v_change < 0 then
    raise exception 'Not enough stock: % on hand', v_on_hand using errcode = '23514';
  end if;
  if p_type = 'return' and p_institution is not null
     and erp_private.inventory_outstanding(p_item, p_institution) < p_quantity then
    raise exception 'Cannot return more than is out with this institution (% outstanding)',
      erp_private.inventory_outstanding(p_item, p_institution) using errcode = '23514';
  end if;

  update public.inventory_items set quantity_on_hand = v_on_hand + v_change where id = p_item;
  insert into public.inventory_movements
    (item_id, movement_type, quantity_change, balance_after, institution_id, issued_to, reference, note, created_by)
  values (p_item, p_type, v_change, v_on_hand + v_change, p_institution, p_issued_to,
          nullif(trim(p_reference), ''), nullif(trim(p_note), ''), v_uid)
  returning id into v_id;
  return v_id;
end $$;

-- Build kits from components on hand (or break kits back into components).
create or replace function public.erp_inventory_build_kits(
  p_kit uuid,
  p_count integer,
  p_disassemble boolean default false,
  p_note text default null
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := erp_private.require_super_admin();
  v_batch uuid := gen_random_uuid();
  v_type public.inventory_movement_type := case when p_disassemble then 'disassemble' else 'assemble' end;
  v_sign integer := case when p_disassemble then 1 else -1 end;
  v_kit public.inventory_items;
  r record;
begin
  if p_count is null or p_count < 1 or p_count > 10000 then
    raise exception 'Enter how many kits (1 to 10000)' using errcode = '22023';
  end if;
  select * into v_kit from public.inventory_items where id = p_kit for update;
  if not found or v_kit.kind <> 'kit' then
    raise exception 'Kit not found' using errcode = 'P0002';
  end if;
  if not exists (select 1 from public.inventory_kit_components where kit_id = p_kit) then
    raise exception 'Add components to this kit before building it' using errcode = '55000';
  end if;
  if p_disassemble and v_kit.quantity_on_hand < p_count then
    raise exception 'Not enough kits: % on hand', v_kit.quantity_on_hand using errcode = '23514';
  end if;

  -- Lock components in a fixed order so concurrent builds cannot deadlock.
  for r in
    select i.id, i.name, i.quantity_on_hand, c.quantity * p_count as needed
    from public.inventory_kit_components c
    join public.inventory_items i on i.id = c.component_id
    where c.kit_id = p_kit
    order by i.id
    for update of i
  loop
    if not p_disassemble and r.quantity_on_hand < r.needed then
      raise exception 'Not enough %: need %, have %', r.name, r.needed, r.quantity_on_hand using errcode = '23514';
    end if;
    update public.inventory_items set quantity_on_hand = quantity_on_hand + v_sign * r.needed where id = r.id;
    insert into public.inventory_movements
      (item_id, movement_type, quantity_change, balance_after, note, batch_id, created_by)
    values (r.id, v_type, v_sign * r.needed, r.quantity_on_hand + v_sign * r.needed,
            coalesce(nullif(trim(p_note), ''), format('%s × %s', p_count, v_kit.name)), v_batch, v_uid);
  end loop;

  update public.inventory_items set quantity_on_hand = quantity_on_hand - v_sign * p_count where id = p_kit;
  insert into public.inventory_movements
    (item_id, movement_type, quantity_change, balance_after, note, batch_id, created_by)
  values (p_kit, v_type, -v_sign * p_count, v_kit.quantity_on_hand - v_sign * p_count,
          nullif(trim(p_note), ''), v_batch, v_uid);
  return v_batch;
end $$;

-- Overview numbers for the inventory dashboard.
create or replace function public.erp_inventory_summary()
returns jsonb language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'items',        (select count(*) from public.inventory_items where is_active and kind = 'component'),
    'kits',         (select count(*) from public.inventory_items where is_active and kind = 'kit'),
    'units',        (select coalesce(sum(quantity_on_hand), 0) from public.inventory_items where is_active),
    'low_stock',    (select count(*) from public.inventory_items
                     where is_active and reorder_level > 0 and quantity_on_hand <= reorder_level),
    'out_of_stock', (select count(*) from public.inventory_items where is_active and quantity_on_hand = 0),
    'stock_value',  (select coalesce(sum(quantity_on_hand * unit_cost), 0) from public.inventory_items where is_active),
    'issued_out',   (select coalesce(-sum(quantity_change), 0) from public.inventory_movements
                     where movement_type in ('issue', 'return') and institution_id is not null)
  )
$$;

-- Units out with each institution, per item (issued − returned), non-zero only.
create or replace function public.erp_inventory_outstanding()
returns table (
  institution_id uuid, institution_name text, institution_type public.institution_type,
  item_id uuid, sku text, item_name text, kind public.inventory_item_kind, unit text,
  outstanding integer, last_movement timestamptz
) language sql stable security invoker set search_path = '' as $$
  select i.id, i.name, i.institution_type, it.id, it.sku, it.name, it.kind, it.unit,
         (-sum(m.quantity_change))::integer, max(m.occurred_at)
  from public.inventory_movements m
  join public.institutions i on i.id = m.institution_id
  join public.inventory_items it on it.id = m.item_id
  where m.movement_type in ('issue', 'return')
  group by i.id, i.name, i.institution_type, it.id, it.sku, it.name, it.kind, it.unit
  having sum(m.quantity_change) <> 0
  order by i.name, it.name
$$;

revoke all on function public.erp_inventory_move(uuid, public.inventory_movement_type, integer, uuid, text, text, text) from public, anon;
revoke all on function public.erp_inventory_build_kits(uuid, integer, boolean, text) from public, anon;
revoke all on function public.erp_inventory_summary() from public, anon;
revoke all on function public.erp_inventory_outstanding() from public, anon;
grant execute on function public.erp_inventory_move(uuid, public.inventory_movement_type, integer, uuid, text, text, text) to authenticated;
grant execute on function public.erp_inventory_build_kits(uuid, integer, boolean, text) to authenticated;
grant execute on function public.erp_inventory_summary() to authenticated;
grant execute on function public.erp_inventory_outstanding() to authenticated;
