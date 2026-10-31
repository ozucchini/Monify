import { z } from "zod";
import { sql } from "@/lib/db";
import { fail, guard, json } from "@/lib/api";

const schema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.number().positive().max(999_999_999),
  description: z.string().trim().min(1, "Informe a descrição").max(120),
  category_id: z.string().uuid().nullable().optional(),
  occurred_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  payment_method: z.string().trim().max(40).nullable().optional(),
  notes: z.string().trim().max(300).nullable().optional(),
});

export async function POST(req: Request) {
  const denied = await guard(); if (denied) return denied;
  const p = schema.safeParse(await req.json().catch(() => ({})));
  if (!p.success) return fail(p.error.issues[0].message);
  const t = p.data;
  try {
    const [row] = await sql`insert into transactions (type, amount, description, category_id, occurred_on, payment_method, notes, source)
      values (${t.type}, ${t.amount}, ${t.description}, ${t.category_id ?? null}, ${t.occurred_on},
              ${t.payment_method || null}, ${t.notes || null}, 'web') returning id`;
    return json({ id: row.id }, 201);
  } catch {
    return fail("Não foi possível salvar (confira a data e a categoria).");
  }
}
