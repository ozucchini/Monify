const base = (token: string) => `https://api.telegram.org/bot${token}`;

async function call<T>(token: string, method: string, body?: object): Promise<T> {
  const res = await fetch(`${base(token)}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
    cache: "no-store",
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.description ?? "Erro na Telegram Bot API");
  return json.result as T;
}

export const getMe = (t: string) => call<{ id: number; username: string; first_name: string }>(t, "getMe");
export const sendMessage = (t: string, chat_id: number, text: string) => call(t, "sendMessage", { chat_id, text });
export const setWebhook = (t: string, url: string, secret: string) =>
  call(t, "setWebhook", { url, secret_token: secret, allowed_updates: ["message"], drop_pending_updates: true });
export const deleteWebhook = (t: string) => call(t, "deleteWebhook");
