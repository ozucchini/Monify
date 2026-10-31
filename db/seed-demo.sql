-- OPCIONAL: dados de demonstração para ver o painel preenchido. Rode só em banco de testes.
insert into transactions (type, amount, description, category_id, occurred_on, source, status)
select v.type::tx_type, v.amount, v.descr, (select id from categories c where c.name = v.cat and c.type = v.type::tx_type),
       (date_trunc('month', now() at time zone 'America/Sao_Paulo')::date + v.dayoff), 'web', v.status::tx_status
from (values
  ('income', 7850.00, 'Salário',     'Salário',     4,  'confirmed'),
  ('expense',1650.00, 'Aluguel',     'Moradia',     4,  'confirmed'),
  ('expense', 212.40, 'Mercado',     'Alimentação', 7,  'pending'),
  ('expense',  55.90, 'Netflix',     'Assinaturas', 10, 'confirmed'),
  ('expense',  80.00, 'Combustível', 'Transporte',  11, 'confirmed'),
  ('expense',  35.00, 'Almoço',      'Alimentação', 12, 'confirmed')
) as v(type, amount, descr, cat, dayoff, status)
where (date_trunc('month', now() at time zone 'America/Sao_Paulo')::date + v.dayoff) <= (now() at time zone 'America/Sao_Paulo')::date;

insert into budgets (category_id, monthly_limit)
select id, lim from categories c join (values ('Alimentação',1200),('Transporte',500),('Lazer',500)) b(n, lim) on b.n = c.name and c.type='expense'
on conflict (category_id) do nothing;
