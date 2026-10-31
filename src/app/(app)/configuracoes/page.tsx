import { LogoutButton } from "@/components/LogoutButton";

export const metadata = { title: "Configurações" };

export default function Page() {
  return (
    <>
      <div className="page-h"><h1 className="serif">Configurações</h1><p>Dados e sessão</p></div>
      <div className="card" style={{ maxWidth: 520 }}>
        <h2 className="serif">Seus dados</h2>
        <div className="sub">Baixe todas as transações em CSV (abre direto no Excel).</div>
        <a className="btn" href="/api/export" style={{ marginBottom: 22 }}>Exportar CSV</a>
        <h2 className="serif" style={{ marginTop: 18 }}>Sessão</h2>
        <div className="sub">A sessão expira sozinha em 7 dias.</div>
        <LogoutButton className="btn ghost" />
      </div>
    </>
  );
}
