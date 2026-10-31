export type ParsedIntent =
  | { kind: "transaction"; type: "income" | "expense"; amount: number; description: string; category: string; date: string; ambiguous: boolean }
  | { kind: "query"; query: "balance" | "top_expense" | "category_total"; category?: string }
  | { kind: "unknown" };

// Para usar um LLM no futuro, implemente esta interface e troque no webhook.
export interface MessageInterpreter { interpret(text: string, now?: Date): Promise<ParsedIntent> }

const EXPENSE: Record<string, string[]> = {
  Alimentação: ["almoço", "almoco", "jantar", "café", "mercado", "lanche", "restaurante", "ifood", "padaria"],
  Transporte: ["combustível", "combustivel", "gasolina", "uber", "ônibus", "onibus", "estacionamento"],
  Moradia: ["aluguel", "condomínio", "condominio", "luz", "água", "agua", "internet"],
  Saúde: ["farmácia", "farmacia", "médico", "medico", "consulta", "remédio", "remedio"],
  Lazer: ["cinema", "bar", "show", "viagem", "jogo"],
  Compras: ["roupa", "tênis", "tenis", "compra"],
  Assinaturas: ["netflix", "spotify", "assinatura", "prime"],
  Educação: ["curso", "livro", "faculdade", "escola"],
};
const INCOME: Record<string, string[]> = {
  Salário: ["salário", "salario"], Freelance: ["freela", "freelance"],
  Investimentos: ["dividendo", "rendimento", "juros"], Vendas: ["venda", "vendi"],
};

// "2.650" -> 2650 | "2650,50" -> 2650.5 | "35" -> 35
export function parseAmount(text: string): number | null {
  const m = text.match(/(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:,\d{1,2})?)/);
  return m ? Number(m[1].replace(/\./g, "").replace(",", ".")) : null;
}

const pick = (map: Record<string, string[]>, t: string) =>
  Object.entries(map).find(([, w]) => w.some((x) => t.includes(x)))?.[0] ?? null;

export class RuleBasedInterpreter implements MessageInterpreter {
  async interpret(text: string, now = new Date()): Promise<ParsedIntent> {
    const t = text.toLowerCase().trim();

    if (/quanto (eu )?(tenho|sobrou)|saldo|dispon[ií]vel/.test(t)) return { kind: "query", query: "balance" };
    if (/maior (despesa|gasto)/.test(t)) return { kind: "query", query: "top_expense" };
    const c = t.match(/quanto (?:eu )?gastei com ([a-zçãéíóú]+)/);
    if (c) return { kind: "query", query: "category_total", category: pick(EXPENSE, c[1]) ?? c[1].charAt(0).toUpperCase() + c[1].slice(1) };

    const amount = parseAmount(t);
    const isIncome = /recebi|ganhei|entrou|vendi/.test(t);
    const isExpense = /gastei|paguei|comprei/.test(t);
    if (!amount || (!isIncome && !isExpense)) return { kind: "unknown" };

    const type = isIncome ? "income" : "expense";
    const found = pick(type === "income" ? INCOME : EXPENSE, t);
    const date = new Date(now);
    if (t.includes("ontem")) date.setDate(date.getDate() - 1);

    const description = t
      .replace(/\b(hoje|ontem|gastei|recebi|paguei|comprei|reais|r\$|de|no|na|em)\b/g, " ")
      .replace(/[\d.,]+/g, " ").replace(/\s+/g, " ").trim() || (type === "income" ? "Receita" : "Despesa");

    return {
      kind: "transaction", type, amount,
      description: description.charAt(0).toUpperCase() + description.slice(1),
      category: found ?? "Outros", date: date.toISOString().slice(0, 10), ambiguous: !found,
    };
  }
}
