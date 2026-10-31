create extension if not exists pgcrypto;
create type tx_type as enum ('income','expense');
create type tx_status as enum ('confirmed','pending');

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null, type tx_type not null, color text,
  unique (name, type)
);
create table transactions (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories on delete set null,
  type tx_type not null,
  description text not null,
  amount numeric(14,2) not null check (amount > 0),
  occurred_on date not null default current_date,
  payment_method text, notes text,
  status tx_status not null default 'confirmed',
  source text not null default 'web',
  external_id text unique,
  created_at timestamptz default now()
);
create index on transactions (occurred_on desc);
create table budgets (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null unique references categories on delete cascade,
  monthly_limit numeric(14,2) not null check (monthly_limit > 0)
);
create table telegram_integration (          -- uma única linha
  id int primary key default 1 check (id = 1),
  bot_token_enc text not null, bot_username text,
  chat_id bigint, webhook_secret text not null
);
create table telegram_messages (
  id uuid primary key default gen_random_uuid(),
  direction text not null check (direction in ('in','out')),
  text text not null, update_id bigint unique,
  created_at timestamptz default now()
);

insert into categories (name, type) values
 ('Alimentação','expense'),('Transporte','expense'),('Moradia','expense'),('Saúde','expense'),
 ('Lazer','expense'),('Compras','expense'),('Assinaturas','expense'),('Educação','expense'),('Outros','expense'),
 ('Salário','income'),('Freelance','income'),('Investimentos','income'),('Vendas','income'),('Outros','income');
