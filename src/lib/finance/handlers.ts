import { sql } from "@/lib/db";
import { brl } from "@/lib/format";
import { monthStart, todaySP } from "@/lib/date";
import type { ParsedIntent } from "./parser";

const HELP =
  "Registre em linguagem natural:\n• Gastei 80 de combustível\n• Recebi 2.650 de salário\n• Paguei 55,90 de Netflix ontem\n\nPerguntas:\n• Quanto tenho disponível?\n• Quanto gastei com alimentação?\n• Qual foi a maior despesa?\n\nComandos: /saldo • /gastos • /receitas • /resumo";

async function balance() {
  const [r] = await sql`select
    coalesce(sum(amount) filter (where type='income'),0)::float as income,
    coalesce(sum(amount) filter (where type='expense'),0)::float as expense
    from transactions where status='confirmed'`;
  return r.income - r.expense;
}

async function monthTotals() {
  const from = monthStart(todaySP());
  const [r] = await sql`select
    coalesce(sum(amount) filter (where type='income'),0)::float as income,
    coalesce(sum(amount) filter (where type='expense'),0)::float as expense
    from transactions where status='confirmed' and occurred_on >= ${from}`;
  return { income: r.income as number, expense: r.expense as number };
}

export async function handleIntent(intent: ParsedIntent, externalId: string) {
  if (intent.kind === "unknown")
    return "Não entendi. Tente “Gastei 35 reais no almoço” ou “Recebi 2.650 de salário”. Use /ajuda.";

  if (intent.kind === "transaction") {
    let inserted: unknown[];
    try {
      inserted = await sql`insert into transactions (type, amount, description, category_id, occurred_on, source, external_id, status)
        values (${intent.type}, ${intent.amount}, ${intent.description},
          (select id from categories where name=${intent.category} and type=${intent.type}),
          ${intent.date}, ${externalId.startsWith("tg:") ? "telegram" : "web"}, ${externalId}, ${intent.ambiguous ? "pending" : "confirmed"})
        on conflict (external_id) do nothing returning id`;
    } catch (e) {
      console.error("registrar transação", e);
      return "Não consegui registrar agora. Tente novamente.";
    }
    if (!inserted.length) return "Essa mensagem já foi registrada.";
    const label = intent.type === "income" ? "Receita" : "Despesa";
    return intent.ambiguous
      ? `${label} de ${brl(intent.amount)} salva como pendente (categoria incerta). Confirme no painel.`
      : `✅ ${label} registrada: ${brl(intent.amount)} • ${intent.category}`;
  }

  const from = monthStart(todaySP());
  if (intent.query === "balance") return `Saldo disponível: ${brl(await balance())}`;

  if (intent.query === "top_expense") {
    const [r] = await sql`select description, amount::float as amount from transactions
      where type='expense' and status='confirmed' and occurred_on >= ${from} order by amount desc limit 1`;
    return r ? `Maior despesa do mês: ${r.description} (${brl(r.amount)})` : "Sem despesas neste mês.";
  }

  const [exists] = await sql`select 1 as ok from categories where name=${intent.category!} and type='expense'`;
  if (!exists) return `Não encontrei a categoria “${intent.category}”.`;
  const [r] = await sql`select coalesce(sum(t.amount),0)::float as total from transactions t
    join categories c on c.id=t.category_id
    where t.type='expense' and t.status='confirmed' and c.name=${intent.category!} and t.occurred_on >= ${from}`;
  return `Gasto com ${intent.category} neste mês: ${brl(r.total)}`;
}

export async function handleCommand(text: string) {
  switch (text.trim().split(/\s+/)[0].split("@")[0].toLowerCase()) {
    case "/start": return "Olá! Sou o assistente Monify. Registre gastos em linguagem natural ou use /ajuda.";
    case "/saldo": return `Saldo: ${brl(await balance())}`;
    case "/gastos": return `Despesas do mês: ${brl((await monthTotals()).expense)}`;
    case "/receitas": return `Receitas do mês: ${brl((await monthTotals()).income)}`;
    case "/resumo": {
      const m = await monthTotals();
      return `Resumo do mês\nReceitas: ${brl(m.income)}\nDespesas: ${brl(m.expense)}\nEconomia: ${brl(m.income - m.expense)}\nSaldo total: ${brl(await balance())}`;
    }
    default: return HELP;
  }
}
