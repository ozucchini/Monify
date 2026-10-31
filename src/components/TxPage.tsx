import Link from "next/link";
import { getCategories, listTransactions } from "@/lib/dashboard";
import { todaySP } from "@/lib/date";
import { NewTxButton } from "./NewTxButton";
import { TxTable } from "./TxTable";

export type Tipo = "all" | "income" | "expense" | "pending";
const FILTERS: { tipo: Tipo; label: string }[] = [
  { tipo: "all", label: "Todas" }, { tipo: "income", label: "Receitas" },
  { tipo: "expense", label: "Despesas" }, { tipo: "pending", label: "Pendentes" },
];
export const parseTipo = (v?: string): Tipo => (v === "income" || v === "expense" || v === "pending" ? v : "all");

export async function TxPage({ tipo, title, subtitle, withFilters = false }: { tipo: Tipo; title: string; subtitle: string; withFilters?: boolean }) {
  const [rows, categories] = await Promise.all([listTransactions(tipo), getCategories()]);
  return (
    <>
      <div className="top page-h">
        <div><h1 className="serif">{title}</h1><p>{subtitle}</p></div>
        <NewTxButton categories={categories} today={todaySP()} />
      </div>
      {withFilters && (
        <div className="filters" role="tablist" aria-label="Filtrar">
          {FILTERS.map((f) => (
            <Link key={f.tipo} href={f.tipo === "all" ? "/transacoes" : `/transacoes?tipo=${f.tipo}`} className={f.tipo === tipo ? "on" : ""} aria-current={f.tipo === tipo ? "page" : undefined}>{f.label}</Link>
          ))}
        </div>
      )}
      <div className="card">
        <TxTable rows={rows} categories={categories} actions />
        {rows.length === 100 && <div className="sub" style={{ marginTop: 10 }}>Mostrando as 100 mais recentes. Use a exportação CSV em Configurações para ver tudo.</div>}
      </div>
    </>
  );
}
