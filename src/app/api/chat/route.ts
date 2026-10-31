import { randomUUID } from "crypto";
import { z } from "zod";
import { sql } from "@/lib/db";
import { fail, guard, json } from "@/lib/api";
import { processText } from "@/lib/finance/process";

const schema = z.object({ text: z.string().trim().min(1).max(500) });

/** Chat do painel: usa o mesmo interpretador do bot, sem passar pelo Telegram. */
export async function POST(req: Request) {
  const denied = await guard(); if (denied) return denied;
  const p = schema.safeParse(await req.json().catch(() => ({})));
  if (!p.success) return fail("Mensagem inválida");
  await sql`insert into telegram_messages (direction, text) values ('in', ${p.data.text})`;
  const reply = await processText(p.data.text, `web:${randomUUID()}`);
  await sql`insert into telegram_messages (direction, text) values ('out', ${reply})`;
  return json({ reply });
}
