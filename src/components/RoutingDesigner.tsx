import React, { useState, useEffect } from "react";

const DEFAULT = ["classifier", "llm", "cheapest"] as const;
const LABELS: Record<string, string> = {
  classifier: "Basic Classifier",
  llm: "LLM Router",
  cheapest: "Cheapest Fallback"
};

export default function RoutingDesigner() {
  const [order, setOrder] = useState<string[]>(() => {
    try {
      const raw = JSON.parse(localStorage.getItem("routingOrder") || "[]");
      return Array.isArray(raw) && raw.length ? raw : [...DEFAULT];
    } catch {
      return [...DEFAULT];
    }
  });

  useEffect(() => {
    localStorage.setItem("routingOrder", JSON.stringify(order));
  }, [order]);

  const swap = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    setOrder(next);
  };

  return (
    <section>
      <h3 style={{ marginTop: 0 }}>Routing Order</h3>
      {order.map((id, i) => (
        <div
          key={id}
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 6,
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: 4,
            padding: 6
          }}
        >
          <span style={{ flex: 1 }}>{LABELS[id]}</span>
          <button onClick={() => swap(i, -1)} disabled={i === 0}>
            ↑
          </button>
          <button
            onClick={() => swap(i, 1)}
            disabled={i === order.length - 1}
            style={{ marginLeft: 4 }}
          >
            ↓
          </button>
        </div>
      ))}
    </section>
  );
}
