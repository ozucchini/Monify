import { checkPassword, startSession } from "@/lib/auth";
import { fail, json } from "@/lib/api";

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({}));
  if (typeof password !== "string" || !checkPassword(password)) {
    await new Promise((r) => setTimeout(r, 600)); // freia tentativas em massa
    return fail("Senha incorreta", 401);
  }
  await startSession();
  return json({ ok: true });
}
