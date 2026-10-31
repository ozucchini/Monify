import { getCategories, getOverview } from "@/lib/dashboard";
import { brl } from "@/lib/format";
import { BudgetDelete, BudgetForm } from "@/components/BudgetForm";

export const metadata = { title: "Orçamentos" };

export default async function Page() {
  const [{ budgets }, categories] = await Promise.all([getOverview("mes"), getCategories()]);
  return (
    <>
      <div className="page-h"><h1 className="serif">Orçamentos</h1><p>Defina um limite mensal por categoria de despesa</p></div>
      <div className="g2" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
        <div className="card">
          <h2 className="serif">Neste mês</h2><div className="sub">Considera apenas despesas confirmadas</div>
          {budgets.length === 0 && <div className="empty">Nenhum orçamento definido ainda.</div>}
          {budgets.map((b) => {
            const r = b.spent / b.lim, hot = r >= 0.8;
            return (
              <div key={b.category_id} style={{ marginBottom: 6 }}>
                <div className="bm">
                  <span>{b.name}{r > 1 ? <b className="over"> · limite excedido</b> : hot ? " · atenção" : ""}</span>
                  <span style={{ color: "var(--mut)" }}>{brl(b.spent)} / {brl(b.lim)} ({Math.round(r * 100)}%)</span>
                </div>
                <div className="bar"><span style={{ width: `${Math.min(r * 100, 100)}%`, ...(hot ? { background: "linear-gradient(90deg,#FC734D,#FDA48A)" } : {}) }} /></div>
                <div style={{ textAlign: "right", marginTop: -6, marginBottom: 8 }}><BudgetDelete categoryId={b.category_id} name={b.name} /></div>
              </div>
            );
          })}
        </div>
        <div className="card">
          <h2 className="serif">Definir limite</h2><div className="sub">Se a categoria já tem orçamento, o valor é atualizado</div>
          <BudgetForm categories={categories} />
        </div>
      </div>
    </>
  );
}
