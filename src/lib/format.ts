export const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Variação percentual formatada: "+4,2%" / "−3,1%" ; null quando não há base de comparação. */
export function pct(cur: number, prev: number): { text: string; up: boolean } | null {
  if (!prev || !isFinite(prev)) return null;
  const v = ((cur - prev) / Math.abs(prev)) * 100;
  const s = Math.abs(v).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return { text: `${v >= 0 ? "+" : "−"}${s}%`, up: v >= 0 };
}
