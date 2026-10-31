import type { SupabaseClient } from "@supabase/supabase-js";
import type { ParsedIntent } from "./parser";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const monthStart = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10); };

async function totals(db: SupabaseClient, userId: string) {
  const { data } = await db.from("transactions").select("type, amount").eq("user_id", userId).eq("status", "confirmed");
  let income = 0, expense = 0;
  for (const t of data ?? []) t.type === "income" ? (income += Number(t.amount)) : (expense += Number(t.amount));
  return { income, expense, balance: income - expense };
}

export async function handleIntent(db: SupabaseClient, userId: string, intent: ParsedIntent, externalId: string) {
  if (intent.kind === "unknown")
    return "Não entendi. Tente “Gastei 35 reais no almoço” ou “Recebi 2.650 de salário”. Use /ajuda.";

  if (intent.kind === "transaction") {
    const { data: cat } = await db.from("categories").select("id").eq("user_id", userId)
      .eq("name", intent.category).eq("type", intent.type).maybeSingle();
    const { error } = await db.from("transactions").insert({
      user_id: userId, type: intent.type, amount: intent.amount, description: intent.description,
      category_id: cat?.id ?? null, occurred_on: intent.date, source: "telegram", external_id: externalId,
      status: intent.ambiguous ? "pending" : "confirmed",
    });
    if (error) return "Não consegui registrar agora. Tente novamente.";
    const label = intent.type === "income" ? "Receita" : "Despesa";
    return intent.ambiguous
      ? `${label} de ${brl(intent.amount)} salva como pendente (categoria incerta). Confirme no painel.`
      : `✅ ${label} registrada: ${brl(intent.amount)} • ${intent.category}`;
  }

  if (intent.query === "balance") return `Saldo disponível: ${brl((await totals(db, userId)).balance)}`;
  if (intent.query === "top_expense") {
    const { data } = await db.from("transactions").select("description, amount").eq("user_id", userId)
      .eq("type", "expense").gte("occurred_on", monthStart()).order("amount", { ascending: false }).limit(1);
    return data?.[0] ? `Maior despesa do mês: ${data[0].description} (${brl(Number(data[0].amount))})` : "Sem despesas neste mês.";
  }
  const { data } = await db.from("transactions").select("amount, categories!inner(name)").eq("user_id", userId)
    .eq("type", "expense").eq("categories.name", intent.category!).gte("occurred_on", monthStart());
  return `Gasto com ${intent.category} neste mês: ${brl((data ?? []).reduce((s, r) => s + Number(r.amount), 0))}`;
}

export async function handleCommand(db: SupabaseClient, userId: string, text: string) {
  const t = await totals(db, userId);
  switch (text.split(" ")[0].toLowerCase()) {
    case "/start": return "Olá! Sou o assistente Monify. Registre gastos em linguagem natural ou use /ajuda.";
    case "/saldo": return `Saldo: ${brl(t.balance)}`;
    case "/gastos": return `Total de despesas: ${brl(t.expense)}`;
    case "/receitas": return `Total de receitas: ${brl(t.income)}`;
    case "/resumo": return `Receitas: ${brl(t.income)}\nDespesas: ${brl(t.expense)}\nSaldo: ${brl(t.balance)}`;
    default: return "/saldo • /gastos • /receitas • /resumo\nOu escreva: “Gastei 80 de combustível”.";
  }
}
