-- Monify • schema para Neon (Postgres). Pode ser executado mais de uma vez.
create extension if not exists pgcrypto;

do $$ begin create type tx_type as enum ('income','expense'); exception when duplicate_object then null; end $$;
do $$ begin create type tx_status as enum ('confirmed','pending'); exception when duplicate_object then null; end $$;

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null, type tx_type not null, color text,
  unique (name, type)
);
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories on delete set null,
  type tx_type not null,
  description text not null,
  amount numeric(14,2) not null check (amount > 0),
  occurred_on date not null default (now() at time zone 'America/Sao_Paulo')::date,
  payment_method text, notes text,
  status tx_status not null default 'confirmed',
  source text not null default 'web',
  external_id text unique,
  created_at timestamptz default now()
);
create index if not exists transactions_occurred_on_idx on transactions (occurred_on desc);
create index if not exists transactions_status_idx on transactions (status) where status = 'pending';

create table if not exists budgets (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null unique references categories on delete cascade,
  monthly_limit numeric(14,2) not null check (monthly_limit > 0)
);
create table if not exists telegram_integration (          -- uma única linha
  id int primary key default 1 check (id = 1),
  bot_token_enc text not null, bot_username text,
  chat_id bigint, webhook_secret text not null,
  pairing_code text                                          -- o 1º chat precisa enviar /start <código>
);
create table if not exists telegram_messages (
  id uuid primary key default gen_random_uuid(),
  direction text not null check (direction in ('in','out')),
  text text not null, update_id bigint unique,
  created_at timestamptz default now()
);
create index if not exists telegram_messages_created_idx on telegram_messages (created_at desc);

insert into categories (name, type) values
 ('Alimentação','expense'),('Transporte','expense'),('Moradia','expense'),('Saúde','expense'),
 ('Lazer','expense'),('Compras','expense'),('Assinaturas','expense'),('Educação','expense'),('Outros','expense'),
 ('Salário','income'),('Freelance','income'),('Investimentos','income'),('Vendas','income'),('Outros','income')
on conflict (name, type) do nothing;
