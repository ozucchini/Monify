import { sql } from "@/lib/db";
import { guard, json } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await guard(); if (denied) return denied;
  const rows = await sql`select direction, text, created_at from (
    select direction, text, created_at from telegram_messages order by created_at desc limit 30
  ) m order by created_at asc`;
  return json({ messages: rows });
}
