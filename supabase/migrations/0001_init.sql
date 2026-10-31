create extension if not exists "pgcrypto";

create type tx_type as enum ('income','expense');
create type tx_status as enum ('confirmed','pending');

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text, avatar_url text, created_at timestamptz default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  name text not null, type tx_type not null, color text,
  unique (user_id, name, type)
);

create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  category_id uuid references categories on delete set null,
  type tx_type not null,
  description text not null,
  amount numeric(14,2) not null check (amount > 0),
  occurred_on date not null default current_date,
  payment_method text, notes text,
  status tx_status not null default 'confirmed',
  source text not null default 'web',
  external_id text,
  created_at timestamptz default now(),
  unique (user_id, external_id)
);
create index on transactions (user_id, occurred_on desc);

create table budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  category_id uuid not null references categories on delete cascade,
  monthly_limit numeric(14,2) not null check (monthly_limit > 0),
  unique (user_id, category_id)
);

create table telegram_integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references profiles on delete cascade,
  bot_token_enc text not null,
  bot_username text,
  chat_id bigint,
  webhook_secret text not null,
  active boolean default true,
  created_at timestamptz default now()
);

create table telegram_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  direction text not null check (direction in ('in','out')),
  text text not null,
  update_id bigint,
  created_at timestamptz default now(),
  unique (user_id, update_id)
);

do $$ declare t text; begin
  foreach t in array array['categories','transactions','budgets','telegram_messages'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy "own rows" on %I for all using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;

alter table profiles enable row level security;
create policy "own profile" on profiles for all using (id = auth.uid()) with check (id = auth.uid());

-- Sem policy: o token só é acessível pelo servidor via service role.
alter table telegram_integrations enable row level security;
