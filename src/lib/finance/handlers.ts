import { sql } from "@/lib/db";
import type { ParsedIntent } from "./parser";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

async function totals() {
  const [r] = await sql`select
    coalesce(sum(amount) filter (where type='income'),0)::float as income,
    coalesce(sum(amount) filter (where type='expense'),0)::float as expense
    from transactions where status='confirmed'`;
  return { income: r.income, expense: r.expense, balance: r.income - r.expense };
}

export async function handleIntent(intent: ParsedIntent, externalId: string) {
  if (intent.kind === "unknown")
    return "Não entendi. Tente “Gastei 35 reais no almoço” ou “Recebi 2.650 de salário”. Use /ajuda.";

  if (intent.kind === "transaction") {
    try {
      await sql`insert into transactions (type, amount, description, category_id, occurred_on, source, external_id, status)
        values (${intent.type}, ${intent.amount}, ${intent.description},
          (select id from categories where name=${intent.category} and type=${intent.type}),
          ${intent.date}, 'telegram', ${externalId}, ${intent.ambiguous ? "pending" : "confirmed"})
        on conflict (external_id) do nothing`;
    } catch { return "Não consegui registrar agora. Tente novamente."; }
    const label = intent.type === "income" ? "Receita" : "Despesa";
    return intent.ambiguous
      ? `${label} de ${brl(intent.amount)} salva como pendente (categoria incerta). Confirme no painel.`
      : `✅ ${label} registrada: ${brl(intent.amount)} • ${intent.category}`;
  }

  if (intent.query === "balance") return `Saldo disponível: ${brl((await totals()).balance)}`;
  if (intent.query === "top_expense") {
    const [r] = await sql`select description, amount::float as amount from transactions
      where type='expense' and occurred_on >= date_trunc('month', current_date) order by amount desc limit 1`;
    return r ? `Maior despesa do mês: ${r.description} (${brl(r.amount)})` : "Sem despesas neste mês.";
  }
  const [r] = await sql`select coalesce(sum(t.amount),0)::float as total from transactions t
    join categories c on c.id=t.category_id
    where t.type='expense' and c.name=${intent.category!} and t.occurred_on >= date_trunc('month', current_date)`;
  return `Gasto com ${intent.category} neste mês: ${brl(r.total)}`;
}

export async function handleCommand(text: string) {
  const t = await totals();
  switch (text.split(" ")[0].toLowerCase()) {
    case "/start": return "Olá! Sou o assistente Monify. Registre gastos em linguagem natural ou use /ajuda.";
    case "/saldo": return `Saldo: ${brl(t.balance)}`;
    case "/gastos": return `Total de despesas: ${brl(t.expense)}`;
    case "/receitas": return `Total de receitas: ${brl(t.income)}`;
    case "/resumo": return `Receitas: ${brl(t.income)}\nDespesas: ${brl(t.expense)}\nSaldo: ${brl(t.balance)}`;
    default: return "/saldo • /gastos • /receitas • /resumo\nOu escreva: “Gastei 80 de combustível”.";
  }
}
