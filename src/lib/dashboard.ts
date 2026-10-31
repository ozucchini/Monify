import { sql } from "@/lib/db";
import { addMonths, monthStart, todaySP, MONTHS } from "@/lib/date";

export type Period = "mes" | "3m" | "ano";
export const PERIODS: { value: Period; label: string }[] = [
  { value: "mes", label: "Este mês" },
  { value: "3m", label: "Últimos 3 meses" },
  { value: "ano", label: "Este ano" },
];
export const parsePeriod = (v?: string): Period => (v === "3m" || v === "ano" ? v : "mes");

export const PALETTE = ["#0297DE", "#FC734D", "#5CC4F5", "#FDA48A", "#3A4A52"];

export type TxRow = {
  id: string; description: string; amount: number; type: "income" | "expense";
  status: "confirmed" | "pending"; date: string; category: string | null; category_id: string | null; source: string;
};
export type Category = { id: string; name: string; type: "income" | "expense" };

/** Intervalo [from, to) do período e da janela equivalente imediatamente anterior. */
export function range(period: Period, today = todaySP()) {
  const to = addMonths(monthStart(today), 1);
  const from = period === "mes" ? monthStart(today) : period === "3m" ? addMonths(monthStart(today), -2) : today.slice(0, 4) + "-01-01";
  const span = period === "mes" ? 1 : period === "3m" ? 3 : Number(today.slice(5, 7));
  return { from, to, prevFrom: addMonths(from, -span), prevTo: from };
}

async function sums(from: string, to: string) {
  const [r] = await sql`select
    coalesce(sum(amount) filter (where type='income'),0)::float as income,
    coalesce(sum(amount) filter (where type='expense'),0)::float as expense
    from transactions where status='confirmed' and occurred_on >= ${from} and occurred_on < ${to}`;
  return { income: r.income as number, expense: r.expense as number };
}

export async function getOverview(period: Period) {
  const today = todaySP();
  const { from, to, prevFrom, prevTo } = range(period, today);
  const ms = monthStart(today), me = addMonths(ms, 1), flowFrom = addMonths(ms, -5);

  const [cur, prev, [bal], flowRows, catRows, budgets, recent, [pend], [tg], messages] = await Promise.all([
    sums(from, to),
    sums(prevFrom, prevTo),
    sql`select coalesce(sum(case when type='income' then amount else -amount end),0)::float as balance
        from transactions where status='confirmed'`,
    sql`select to_char(date_trunc('month', occurred_on),'YYYY-MM') as m,
        coalesce(sum(amount) filter (where type='income'),0)::float as income,
        coalesce(sum(amount) filter (where type='expense'),0)::float as expense
        from transactions where status='confirmed' and occurred_on >= ${flowFrom} and occurred_on < ${me} group by 1`,
    sql`select coalesce(c.name,'Sem categoria') as name, sum(t.amount)::float as total
        from transactions t left join categories c on c.id=t.category_id
        where t.type='expense' and t.status='confirmed' and t.occurred_on >= ${from} and t.occurred_on < ${to}
        group by 1 order by total desc`,
    sql`select b.category_id, c.name, b.monthly_limit::float as lim,
        coalesce((select sum(t.amount) from transactions t where t.category_id=b.category_id and t.type='expense'
          and t.status='confirmed' and t.occurred_on >= ${ms} and t.occurred_on < ${me}),0)::float as spent
        from budgets b join categories c on c.id=b.category_id order by c.name`,
    sql`select t.id, t.description, t.amount::float as amount, t.type, t.status, t.occurred_on::text as date,
        c.name as category, t.category_id, t.source
        from transactions t left join categories c on c.id=t.category_id
        order by t.occurred_on desc, t.created_at desc limit 8`,
    sql`select count(*)::int as n from transactions where status='pending'`,
    sql`select bot_username, chat_id::text as chat_id, pairing_code from telegram_integration where id=1`,
    sql`select direction, text, created_at from (
          select direction, text, created_at from telegram_messages order by created_at desc limit 30
        ) m order by created_at asc`,
  ]);

  // série dos últimos 6 meses, preenchendo meses sem movimento com zero
  const byMonth = new Map<string, { income: number; expense: number }>(flowRows.map((r) => [r.m as string, r as never]));
  const flow = Array.from({ length: 6 }, (_, i) => {
    const d = addMonths(ms, i - 5);
    const v = byMonth.get(d.slice(0, 7));
    return { label: MONTHS[Number(d.slice(5, 7)) - 1], income: v?.income ?? 0, expense: v?.expense ?? 0 };
  });

  // top 4 categorias + "Outros"
  const top = catRows.slice(0, 4).map((c) => ({ name: c.name as string, total: c.total as number }));
  const rest = catRows.slice(4).reduce((s, c) => s + (c.total as number), 0);
  const cats = (rest > 0 ? [...top, { name: "Outros", total: rest }] : top).map((c, i) => ({ ...c, color: PALETTE[i] }));

  const saved = cur.income - cur.expense, savedPrev = prev.income - prev.expense;
  const balance = bal.balance as number;
  return {
    period, cur, prev, saved, savedPrev, balance, balanceBefore: balance - saved,
    flow, cats, budgets: budgets as { category_id: string; name: string; lim: number; spent: number }[],
    recent: recent as TxRow[], pending: pend.n as number,
    telegram: tg ? { username: tg.bot_username as string, paired: !!tg.chat_id, code: (tg.pairing_code as string) ?? null } : null,
    messages: messages as { direction: "in" | "out"; text: string; created_at: string }[],
  };
}

export async function getCategories() {
  return (await sql`select id, name, type from categories order by type desc, name`) as Category[];
}

export async function listTransactions(tipo: "all" | "income" | "expense" | "pending", limit = 100) {
  return (await sql`select t.id, t.description, t.amount::float as amount, t.type, t.status, t.occurred_on::text as date,
      c.name as category, t.category_id, t.source
      from transactions t left join categories c on c.id=t.category_id
      where (${tipo}::text = 'all' or (${tipo}::text = 'pending' and t.status = 'pending') or t.type::text = ${tipo}::text)
      order by t.occurred_on desc, t.created_at desc limit ${limit}`) as TxRow[];
}

export async function getMonthlyReport(months = 12) {
  const ms = monthStart(todaySP());
  const rows = await sql`select to_char(date_trunc('month', occurred_on),'YYYY-MM') as m,
      coalesce(sum(amount) filter (where type='income'),0)::float as income,
      coalesce(sum(amount) filter (where type='expense'),0)::float as expense
      from transactions where status='confirmed' and occurred_on >= ${addMonths(ms, -(months - 1))} and occurred_on < ${addMonths(ms, 1)}
      group by 1`;
  const map = new Map(rows.map((r) => [r.m as string, r]));
  return Array.from({ length: months }, (_, i) => {
    const d = addMonths(ms, i - (months - 1));
    const v = map.get(d.slice(0, 7));
    return { key: d.slice(0, 7), label: `${MONTHS[Number(d.slice(5, 7)) - 1]}/${d.slice(2, 4)}`, income: (v?.income ?? 0) as number, expense: (v?.expense ?? 0) as number };
  });
}

export async function getCategorySummary() {
  const ms = monthStart(todaySP());
  return (await sql`select c.id, c.name, c.type,
      coalesce(sum(t.amount) filter (where t.status='confirmed' and t.occurred_on >= ${ms}),0)::float as month_total,
      count(t.id)::int as tx_count
      from categories c left join transactions t on t.category_id = c.id
      group by c.id order by c.type desc, month_total desc, c.name`) as { id: string; name: string; type: "income" | "expense"; month_total: number; tx_count: number }[];
}

export async function getTelegramStatus() {
  const [tg] = await sql`select bot_username, chat_id::text as chat_id, pairing_code from telegram_integration where id=1`;
  return tg ? { username: tg.bot_username as string, paired: !!tg.chat_id, code: (tg.pairing_code as string) ?? null } : null;
}

export async function getRecentMessages() {
  return (await sql`select direction, text, created_at from (
      select direction, text, created_at from telegram_messages order by created_at desc limit 30
    ) m order by created_at asc`) as { direction: "in" | "out"; text: string; created_at: string }[];
}
