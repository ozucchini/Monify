import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { encrypt, decrypt } from "@/lib/crypto";
import { getMe, setWebhook, deleteWebhook } from "@/lib/telegram/api";

const schema = z.object({ token: z.string().regex(/^\d+:[\w-]{30,}$/, "Token inválido") });

async function currentUser() {
  const { data: { user } } = await (await createServerClient()).auth.getUser();
  return user;
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  try {
    const { token } = parsed.data;
    const bot = await getMe(token); // valida o token na API real
    const secret = randomBytes(24).toString("hex");
    await setWebhook(token, `${process.env.NEXT_PUBLIC_APP_URL}/api/telegram/webhook?u=${user.id}`, secret);
    await createAdminClient().from("telegram_integrations").upsert({
      user_id: user.id, bot_token_enc: encrypt(token), bot_username: bot.username,
      webhook_secret: secret, active: true, chat_id: null,
    }, { onConflict: "user_id" });
    return NextResponse.json({ bot: { username: bot.username, name: bot.first_name } });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

export async function DELETE() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const admin = createAdminClient();
  const { data } = await admin.from("telegram_integrations").select("bot_token_enc").eq("user_id", user.id).single();
  if (data) await deleteWebhook(decrypt(data.bot_token_enc)).catch(() => {});
  await admin.from("telegram_integrations").delete().eq("user_id", user.id);
  return NextResponse.json({ ok: true });
}
