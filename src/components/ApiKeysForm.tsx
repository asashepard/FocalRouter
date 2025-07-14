import React, { useState } from "react";

const PROVIDERS = ["openai", "google", "mistral"] as const;

export default function ApiKeysForm() {
  const [keys, setKeys] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem("apiKeys") || "{}");
    } catch {
      return {};
    }
  });

  const save = (id: string, value: string) => {
    const next = { ...keys, [id]: value.trim() };
    setKeys(next);
    localStorage.setItem("apiKeys", JSON.stringify(next));
  };

  return (
    <section>
      <h3 style={{ marginTop: 0 }}>API Keys</h3>
      {PROVIDERS.map((id) => (
        <input
          key={id}
          placeholder={`${id} key`}
          defaultValue={keys[id] || ""}
          onBlur={(e) => save(id, e.target.value)}
          spellCheck={false}
          style={{
            width: "100%",
            marginBottom: 10,
            padding: 6,
            border: "1px solid #ccc",
            borderRadius: 4
          }}
        />
      ))}
    </section>
  );
}
