import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const sign = (v: string) => createHmac("sha256", process.env.AUTH_SECRET!).update(v).digest("hex");
const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

export function checkPassword(input: string) {
  const expected = process.env.DASHBOARD_PASSWORD;
  if (!expected) return false;
  // compara hashes de tamanho fixo para não vazar o tamanho da senha
  const h = (s: string) => createHmac("sha256", "monify").update(s).digest();
  return timingSafeEqual(h(input), h(expected));
}

const secure = process.env.NODE_ENV === "production";

export async function startSession() {
  const exp = String(Date.now() + 7 * 864e5);
  (await cookies()).set("monify", `${exp}.${sign(exp)}`, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 7 * 86400 });
}
export async function endSession() {
  (await cookies()).delete("monify");
}
export async function isAuthed() {
  const [exp, sig] = ((await cookies()).get("monify")?.value ?? "").split(".");
  return !!exp && !!sig && safeEqual(sig, sign(exp)) && Number(exp) > Date.now();
}
