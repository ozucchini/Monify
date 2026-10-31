import { z } from "zod";
import { sql } from "@/lib/db";
import { fail, guard, json } from "@/lib/api";

const idSchema = z.string().uuid();
const patch = z.object({
  status: z.literal("confirmed").optional(),
  category_id: z.string().uuid().optional(),
});
type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const denied = await guard(); if (denied) return denied;
  const id = idSchema.safeParse((await params).id);
  const body = patch.safeParse(await req.json().catch(() => ({})));
  if (!id.success || !body.success) return fail("Requisição inválida");
  const { status = null, category_id = null } = body.data;
  const rows = await sql`update transactions set
      status = coalesce(${status}::tx_status, status),
      category_id = coalesce(${category_id}::uuid, category_id)
    where id = ${id.data} returning id`;
  return rows.length ? json({ ok: true }) : fail("Transação não encontrada", 404);
}

export async function DELETE(_: Request, { params }: Ctx) {
  const denied = await guard(); if (denied) return denied;
  const id = idSchema.safeParse((await params).id);
  if (!id.success) return fail("Requisição inválida");
  await sql`delete from transactions where id = ${id.data}`;
  return json({ ok: true });
}
