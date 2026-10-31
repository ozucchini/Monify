export type ParsedIntent =
  | { kind: "transaction"; type: "income" | "expense"; amount: number; description: string; category: string; date: string; ambiguous: boolean }
  | { kind: "query"; query: "balance" | "top_expense" | "category_total"; category?: string }
  | { kind: "unknown" };

// Para usar um LLM no futuro, implemente esta interface e troque em lib/finance/process.ts.
export interface MessageInterpreter { interpret(text: string, now?: Date): Promise<ParsedIntent> }

// Palavras-chave sem acento; o texto também é normalizado antes de comparar.
const EXPENSE: Record<string, string[]> = {
  Alimentação: ["alimentacao", "almoco", "jantar", "cafe", "mercado", "supermercado", "lanche", "restaurante", "ifood", "padaria", "pizza", "hamburguer", "acougue", "feira"],
  Transporte: ["transporte", "combustivel", "gasolina", "etanol", "uber", "onibus", "metro", "estacionamento", "pedagio", "passagem"],
  Moradia: ["moradia", "aluguel", "condominio", "luz", "agua", "internet", "gas", "iptu"],
  Saúde: ["saude", "farmacia", "medico", "consulta", "remedio", "dentista", "exame"],
  Lazer: ["lazer", "cinema", "bar", "show", "viagem", "jogo", "festa"],
  Compras: ["compras", "roupa", "tenis", "sapato", "compra"],
  Assinaturas: ["assinaturas", "netflix", "spotify", "assinatura", "prime", "youtube", "disney"],
  Educação: ["educacao", "curso", "livro", "faculdade", "escola", "mensalidade"],
};
const INCOME: Record<string, string[]> = {
  Salário: ["salario"], Freelance: ["freela", "freelance"],
  Investimentos: ["dividendo", "rendimento", "juros"], Vendas: ["venda", "vendi"],
};

const strip = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

// "2.650" -> 2650 | "2650,50" -> 2650.5 | "35.5" -> 35.5 | "35" -> 35
export function parseAmount(text: string): number | null {
  const m = text.match(/(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+\.\d{1,2}(?!\d)|\d+(?:,\d{1,2})?)/);
  if (!m) return null;
  const raw = m[1];
  const n = /,/.test(raw) || /\.\d{3}/.test(raw) ? Number(raw.replace(/\./g, "").replace(",", ".")) : Number(raw);
  return isFinite(n) && n > 0 && n < 1e9 ? n : null;
}

// palavra inteira (aceita plural simples), para não casar "bar" em "barato"
const hasWord = (t: string, w: string) => new RegExp(`(^|[^a-z0-9])${w}(s|es)?([^a-z0-9]|$)`).test(t);
const pick = (map: Record<string, string[]>, t: string) =>
  Object.entries(map).find(([, w]) => w.some((x) => hasWord(t, x)))?.[0] ?? null;

const isoDay = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(d);
function shift(iso: string, n: number) {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export class RuleBasedInterpreter implements MessageInterpreter {
  async interpret(text: string, now = new Date()): Promise<ParsedIntent> {
    const lower = text.toLowerCase().trim();
    const t = strip(lower);

    const c = t.match(/quanto (?:eu )?gastei (?:com|em|no|na|de) ([a-z]+)/);
    if (c) return { kind: "query", query: "category_total", category: pick(EXPENSE, c[1]) ?? cap(c[1]) };
    if (/maior (despesa|gasto)/.test(t)) return { kind: "query", query: "top_expense" };
    if (/quanto (eu )?(tenho|sobrou)|\bsaldo\b|disponivel/.test(t)) return { kind: "query", query: "balance" };

    const amount = parseAmount(t);
    const isIncome = /\b(recebi|ganhei|entrou|vendi)\b/.test(t);
    const isExpense = /\b(gastei|paguei|comprei)\b/.test(t);
    if (!amount || (!isIncome && !isExpense)) return { kind: "unknown" };

    const type = isIncome && !isExpense ? "income" : "expense";
    const found = pick(type === "income" ? INCOME : EXPENSE, t);

    let date = isoDay(now);
    if (/\banteontem\b/.test(t)) date = shift(date, -2);
    else if (/\bontem\b/.test(t)) date = shift(date, -1);

    const description = lower
      .replace(/r\$\s*/g, " ")
      // \b não funciona com letras acentuadas (ç, ã…); usamos lookarounds Unicode
      .replace(/(?<![\p{L}\p{N}])(hoje|ontem|anteontem|gastei|recebi|ganhei|paguei|comprei|vendi|entrou|reais|real|de|do|da|no|na|em|com|o|a|um|uma|pra|para)(?![\p{L}\p{N}])/gu, " ")
      .replace(/[\d.,]+/g, " ").replace(/\s+/g, " ").trim()
      || (type === "income" ? "Receita" : "Despesa");

    return {
      kind: "transaction", type, amount, description: cap(description).slice(0, 120),
      category: found ?? "Outros", date, ambiguous: !found,
    };
  }
}
