export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export const callLLM = (
  prov: "openai" | "anthropic" | "google" | "mistral",
  model: string,
  msgs: ChatMessage[],
  keys: Record<string, string>
): Promise<string> => {
  switch (prov) {
    case "openai":
      return openai(model, msgs, keys.openai);
    case "anthropic":
      return anthropic(model, msgs, keys.anthropic);
    case "google":
      return google(model, msgs, keys.google);
    case "mistral":
      return mistral(model, msgs, keys.mistral);
    default:
      return Promise.reject(new Error("Unsupported provider"));
  }
};

const openai = async (
  model: string,
  msgs: ChatMessage[],
  key?: string
): Promise<string> => {
  if (!key) throw new Error("OpenAI key missing");
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ model, messages: msgs })
  });
  if (!r.ok) throw new Error(`OpenAI HTTP ${r.status}`);
  const j = await r.json();
  return j.choices[0].message.content as string;
};

const anthropic = async (
  model: string,
  msgs: ChatMessage[],
  key?: string
): Promise<string> => {
  if (!key) throw new Error("Anthropic key missing");
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ model, max_tokens: 1024, messages: msgs })
  });
  if (!r.ok) throw new Error(`Anthropic HTTP ${r.status}`);
  const j = await r.json();
  return j.content[0].text as string;
};

const google = async (
  model: string,
  msgs: ChatMessage[],
  key?: string
): Promise<string> => {
  if (!key) throw new Error("Google key missing");
  const user = msgs[msgs.length - 1].content;
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: user }] }],
        generationConfig: { maxOutputTokens: 1024 }
      })
    }
  );
  if (!r.ok) throw new Error(`Google HTTP ${r.status}`);
  const j = await r.json();
  return j.candidates[0].content.parts[0].text as string;
};

const mistral = async (
  model: string,
  msgs: ChatMessage[],
  key?: string
): Promise<string> => {
  if (!key) throw new Error("Mistral key missing");
  const r = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ model, messages: msgs })
  });
  if (!r.ok) throw new Error(`Mistral HTTP ${r.status}`);
  const j = await r.json();
  return j.choices[0].message.content as string;
};
