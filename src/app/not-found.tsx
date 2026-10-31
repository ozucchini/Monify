import Link from "next/link";

export default function NotFound() {
  return (
    <main className="login"><div className="card" style={{ textAlign: "center" }}>
      <h1 className="serif" style={{ fontSize: 40 }}>404</h1>
      <p className="sub">Página não encontrada.</p>
      <Link className="btn" href="/">Voltar ao painel</Link>
    </div></main>
  );
}
