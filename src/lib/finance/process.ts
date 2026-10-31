import { RuleBasedInterpreter, type MessageInterpreter } from "./parser";
import { handleCommand, handleIntent } from "./handlers";

// Para trocar por um LLM, devolva outra implementação de MessageInterpreter aqui.
const interpreter: MessageInterpreter = new RuleBasedInterpreter();

/** Pipeline único usado pelo webhook do Telegram e pelo chat do painel. */
export async function processText(raw: string, externalId: string) {
  const text = raw.trim().slice(0, 500);
  if (text.startsWith("/")) return handleCommand(text);
  return handleIntent(await interpreter.interpret(text), externalId);
}
