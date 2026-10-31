import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL && process.env.NODE_ENV === "production") {
  console.warn("DATABASE_URL não definida");
}
// O driver devolve linhas como objetos; tipamos como any[] nas consultas.
export const sql = neon(process.env.DATABASE_URL ?? "postgres://invalid");
