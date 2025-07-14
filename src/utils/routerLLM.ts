export const queryRouterLLM = async (
  names: string[],
  prompt: string,
  mistralKey: string,
  mode: "thrift" | "power" = "thrift"
): Promise<string> => {
  if (!mistralKey) throw new Error("Mistral key missing");
  const sys = "You are a routing assistant. Choose the cheapest model that still reaches 95% of GPT-4o performance. Reply only with the model name.";
  const user = `User prompt: ${prompt}

Candidate models: ${names.join(", ")}

Which model is best? Return a name from the list and nothing else.`;
  const r = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${mistralKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "mistral-small-latest",
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user }
      ],
      max_tokens: 64,
      temperature: 0
    })
  });
  if (!r.ok) throw new Error(`Router LLM HTTP ${r.status}`);
  const json = await r.json();
  return json.choices?.[0]?.message?.content?.trim();
};
