import { getRecentMessages, getTelegramStatus } from "@/lib/dashboard";
import { Chat } from "@/components/Chat";
import { TelegramConnect, TelegramDisconnect } from "@/components/TelegramConnect";

export const metadata = { title: "Assistente Telegram" };

export default async function Page() {
  const [tg, messages] = await Promise.all([getTelegramStatus(), getRecentMessages()]);
  return (
    <>
      <div className="page-h"><h1 className="serif">Assistente Telegram</h1><p>Registre gastos conversando com o seu bot</p></div>
      <div className="g2" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="card">
          {!tg && (
            <>
              <h2 className="serif">Conectar bot</h2>
              <ol className="steps">
                <li>No Telegram, abra o <b>@BotFather</b> e envie <b>/newbot</b>.</li>
                <li>Copie o <b>token</b> que ele devolver e cole abaixo.</li>
                <li>Depois de conectar, envie ao seu bot o código de pareamento que aparecerá aqui.</li>
              </ol>
              <TelegramConnect />
            </>
          )}
          {tg && !tg.paired && (
            <>
              <h2 className="serif">Falta um passo</h2>
              <div className="sub">Bot @{tg.username} conectado. Para vincular o seu chat, envie ao bot:</div>
              <p className="code">/start {tg.code}</p>
              <p className="sub" style={{ margin: "8px 0 14px" }}>Ou abra o link: <a href={`https://t.me/${tg.username}?start=${tg.code}`} target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>t.me/{tg.username}</a>. Só o chat que enviar o código poderá usar o bot.</p>
              <TelegramDisconnect />
            </>
          )}
          {tg?.paired && (
            <>
              <h2 className="serif">Tudo certo</h2>
              <span className="pill" style={{ margin: "8px 0 12px" }}><i />@{tg.username} conectado</span>
              <p className="sub">Exemplos: “gastei 35 no almoço”, “recebi 2.650 de salário”, “quanto tenho disponível?”. Comandos: /saldo /gastos /receitas /resumo /ajuda.</p>
              <TelegramDisconnect />
            </>
          )}
        </div>
        <div className="card chat">
          <h2 className="serif">Conversa</h2>
          <Chat initial={messages} bot={tg?.paired ? tg.username : null} />
        </div>
      </div>
    </>
  );
}
