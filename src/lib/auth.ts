import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const sign = (v: string) => createHmac("sha256", process.env.AUTH_SECRET!).update(v).digest("hex");

export function checkPassword(input: string) {
  const a = Buffer.from(input), b = Buffer.from(process.env.DASHBOARD_PASSWORD!);
  return a.length === b.length && timingSafeEqual(a, b);
}
export async function startSession() {
  const exp = String(Date.now() + 7 * 864e5);
  (await cookies()).set("monify", `${exp}.${sign(exp)}`, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 7 * 86400 });
}
export async function isAuthed() {
  const [exp, sig] = ((await cookies()).get("monify")?.value ?? "").split(".");
  return !!exp && sig === sign(exp) && Number(exp) > Date.now();
}
