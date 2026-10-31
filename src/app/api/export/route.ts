import { sql } from "@/lib/db";
import { guard } from "@/lib/api";

export const dynamic = "force-dynamic";

const cell = (v: unknown) => {
  let s = String(v ?? "");
  if (/^[=+\-@]/.test(s)) s = "'" + s; // evita injeção de fórmula no Excel
  return `"${s.replace(/"/g, '""')}"`;
};

export async function GET() {
  const denied = await guard(); if (denied) return denied;
  const rows = await sql`select t.occurred_on::text as data, t.type, t.description, c.name as categoria,
      t.amount::text as valor, t.status, t.source from transactions t
    left join categories c on c.id = t.category_id order by t.occurred_on desc, t.created_at desc`;
  const head = ["data", "tipo", "descricao", "categoria", "valor", "status", "origem"];
  const body = rows.map((r) => [r.data, r.type, r.description, r.categoria, r.valor, r.status, r.source].map(cell).join(";"));
  return new Response("\uFEFF" + [head.join(";"), ...body].join("\r\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="monify-transacoes.csv"' },
  });
}
