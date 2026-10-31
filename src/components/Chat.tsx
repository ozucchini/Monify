"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Msg = { direction: "in" | "out"; text: string; created_at: string };
const hh = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });

export function Chat({ initial, bot }: { initial: Msg[]; bot: string | null }) {
  const router = useRouter();
  const [msgs, setMsgs] = useState<Msg[]>(initial);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const lastCount = useRef(initial.length);

  // atualiza com o que chegou pelo Telegram
  useEffect(() => {
    const id = setInterval(async () => {
      if (document.hidden || busy) return;
      const r = await fetch("/api/telegram/messages", { cache: "no-store" }).catch(() => null);
      if (!r?.ok) return;
      const { messages } = await r.json();
      setMsgs(messages);
      if (messages.length !== lastCount.current) { lastCount.current = messages.length; router.refresh(); }
    }, 8000);
    return () => clearInterval(id);
  }, [busy, router]);

  useEffect(() => { box.current?.scrollTo({ top: box.current.scrollHeight }); }, [msgs]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const v = text.trim();
    if (!v || busy) return;
    setText(""); setBusy(true);
    const now = new Date().toISOString();
    setMsgs((m) => [...m, { direction: "in", text: v, created_at: now }]);
    const r = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: v }) }).catch(() => null);
    const reply = r?.ok ? (await r.json()).reply : "Não consegui responder agora. Tente novamente.";
    setMsgs((m) => { lastCount.current = m.length + 1; return [...m, { direction: "out", text: reply, created_at: new Date().toISOString() }]; });
    setBusy(false);
    router.refresh();
  }

  return (
    <>
      <div className="sub">{bot ? `@${bot} · online` : "Bot não conectado · o chat do painel funciona mesmo assim"}</div>
      <div className="msgs" ref={box} aria-live="polite">
        {msgs.length === 0 && <div className="empty">Experimente: “gastei 80 de combustível”.</div>}
        {msgs.map((m, i) => (
          <div key={i} className={`m ${m.direction === "in" ? "me" : "bot"}`}>
            {m.text}<small>{hh(m.created_at)}</small>
          </div>
        ))}
      </div>
      <form className="cin" onSubmit={send}>
        <input id="chat-input" value={text} onChange={(e) => setText(e.target.value)} maxLength={500} placeholder="Ex.: gastei 80 de combustível" aria-label="Mensagem" autoComplete="off" />
        <button className="btn" disabled={busy}>Enviar</button>
      </form>
    </>
  );
}
