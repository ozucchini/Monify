import { z } from "zod";
import { sql } from "@/lib/db";
import { fail, guard, json } from "@/lib/api";

const put = z.object({ category_id: z.string().uuid(), monthly_limit: z.number().positive().max(999_999_999) });
const del = z.object({ category_id: z.string().uuid() });

export async function PUT(req: Request) {
  const denied = await guard(); if (denied) return denied;
  const p = put.safeParse(await req.json().catch(() => ({})));
  if (!p.success) return fail("Informe uma categoria e um limite maior que zero");
  await sql`insert into budgets (category_id, monthly_limit) values (${p.data.category_id}, ${p.data.monthly_limit})
    on conflict (category_id) do update set monthly_limit = excluded.monthly_limit`;
  return json({ ok: true });
}

export async function DELETE(req: Request) {
  const denied = await guard(); if (denied) return denied;
  const p = del.safeParse(await req.json().catch(() => ({})));
  if (!p.success) return fail("Requisição inválida");
  await sql`delete from budgets where category_id = ${p.data.category_id}`;
  return json({ ok: true });
}
