import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { decrypt } from "@/lib/crypto";
import { sendMessage } from "@/lib/telegram/api";
import { RuleBasedInterpreter } from "@/lib/finance/parser";
import { handleIntent, handleCommand } from "@/lib/finance/handlers";

const interpreter = new RuleBasedInterpreter();

export async function POST(req: Request) {
  const userId = new URL(req.url).searchParams.get("u");
  if (!userId) return NextResponse.json({ ok: false }, { status: 400 });

  const db = createAdminClient();
  const { data: integ } = await db.from("telegram_integrations").select("*").eq("user_id", userId).eq("active", true).single();
  if (!integ) return NextResponse.json({ ok: false }, { status: 404 });

  // Valida a origem: o Telegram devolve o secret definido no setWebhook
  if (req.headers.get("x-telegram-bot-api-secret-token") !== integ.webhook_secret)
    return NextResponse.json({ ok: false }, { status: 401 });

  const update = await req.json();
  const msg = update?.message;
  if (!msg?.text) return NextResponse.json({ ok: true });

  // Associa o chat ao usuário na 1ª mensagem; ignora chats diferentes depois
  if (!integ.chat_id) await db.from("telegram_integrations").update({ chat_id: msg.chat.id }).eq("id", integ.id);
  else if (integ.chat_id !== msg.chat.id) return NextResponse.json({ ok: true });

  // Idempotência por update_id
  const { error: dup } = await db.from("telegram_messages")
    .insert({ user_id: userId, direction: "in", text: msg.text, update_id: update.update_id });
  if (dup) return NextResponse.json({ ok: true });

  const reply = msg.text.startsWith("/")
    ? await handleCommand(db, userId, msg.text)
    : await handleIntent(db, userId, await interpreter.interpret(msg.text), `tg:${update.update_id}`);

  await sendMessage(decrypt(integ.bot_token_enc), msg.chat.id, reply);
  await db.from("telegram_messages").insert({ user_id: userId, direction: "out", text: reply });
  return NextResponse.json({ ok: true });
}
