import { test } from "node:test";
import assert from "node:assert/strict";
import { parseAmount, RuleBasedInterpreter } from "./parser.ts";

const it = new RuleBasedInterpreter();
const NOW = new Date("2026-10-30T15:00:00Z"); // 12:00 em São Paulo

test("parseAmount: formatos brasileiros", () => {
  assert.equal(parseAmount("35"), 35);
  assert.equal(parseAmount("2.650"), 2650);
  assert.equal(parseAmount("2650,50"), 2650.5);
  assert.equal(parseAmount("1.234.567,89"), 1234567.89);
  assert.equal(parseAmount("35.5"), 35.5);
  assert.equal(parseAmount("r$ 80,00"), 80);
  assert.equal(parseAmount("sem número"), null);
  assert.equal(parseAmount("0"), null);
});

test("despesa simples categorizada", async () => {
  const r = await it.interpret("Gastei 35 reais no almoço", NOW);
  assert.deepEqual(r, { kind: "transaction", type: "expense", amount: 35, description: "Almoço", category: "Alimentação", date: "2026-10-30", ambiguous: false });
});

test("receita com milhar", async () => {
  const r = await it.interpret("Recebi 2.650 de salário", NOW);
  assert.ok(r.kind === "transaction");
  assert.equal(r.type, "income");
  assert.equal(r.amount, 2650);
  assert.equal(r.category, "Salário");
});

test("R$ e acento no combustível", async () => {
  const r = await it.interpret("gastei R$ 80,50 de combustível", NOW);
  assert.ok(r.kind === "transaction");
  assert.equal(r.amount, 80.5);
  assert.equal(r.category, "Transporte");
  assert.equal(r.description, "Combustível");
});

test("ontem e anteontem ajustam a data (fuso de São Paulo)", async () => {
  const a = await it.interpret("paguei 50 de luz ontem", NOW);
  const b = await it.interpret("paguei 50 de luz anteontem", NOW);
  assert.ok(a.kind === "transaction" && b.kind === "transaction");
  assert.equal(a.date, "2026-10-29");
  assert.equal(b.date, "2026-10-28");
});

test("virada de dia usa o fuso de São Paulo, não UTC", async () => {
  const r = await it.interpret("gastei 10 no café", new Date("2026-11-01T01:30:00Z")); // 22:30 de 31/10 em SP
  assert.ok(r.kind === "transaction");
  assert.equal(r.date, "2026-10-31");
});

test("sem categoria conhecida fica ambígua (pendente)", async () => {
  const r = await it.interpret("gastei 20 com coisa aleatória", NOW);
  assert.ok(r.kind === "transaction");
  assert.equal(r.category, "Outros");
  assert.equal(r.ambiguous, true);
});

test("não casa palavra dentro de outra (bar x barato)", async () => {
  const r = await it.interpret("gastei 15 em algo barato", NOW);
  assert.ok(r.kind === "transaction");
  assert.equal(r.ambiguous, true);
});

test("'gas' não casa com 'gastei'", async () => {
  const r = await it.interpret("gastei 99 reais", NOW);
  assert.ok(r.kind === "transaction");
  assert.equal(r.ambiguous, true);
});

test("consultas", async () => {
  assert.deepEqual(await it.interpret("Quanto tenho disponível?", NOW), { kind: "query", query: "balance" });
  assert.deepEqual(await it.interpret("qual meu saldo", NOW), { kind: "query", query: "balance" });
  assert.deepEqual(await it.interpret("qual foi a maior despesa?", NOW), { kind: "query", query: "top_expense" });
  assert.deepEqual(await it.interpret("quanto gastei com alimentação?", NOW), { kind: "query", query: "category_total", category: "Alimentação" });
  assert.deepEqual(await it.interpret("quanto eu gastei com uber", NOW), { kind: "query", query: "category_total", category: "Transporte" });
});

test("mensagens que não entendemos", async () => {
  assert.deepEqual(await it.interpret("oi tudo bem?", NOW), { kind: "unknown" });
  assert.deepEqual(await it.interpret("gastei muito", NOW), { kind: "unknown" });
  assert.deepEqual(await it.interpret("35 reais", NOW), { kind: "unknown" });
});
