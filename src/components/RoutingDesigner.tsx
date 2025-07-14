import React, { useState, useEffect } from "react";
import { STEP_CATALOG, DEFAULT_PIPELINE } from "../utils/stepRegistry";

export default function RoutingDesigner() {
  const [pipe, setPipe] = useState<string[]>(() => {
    try {
      const raw = JSON.parse(localStorage.getItem("routingOrder") || "null");
      return Array.isArray(raw) && raw.length ? raw : [...DEFAULT_PIPELINE];
    } catch {
      return [...DEFAULT_PIPELINE];
    }
  });

  useEffect(() => {
    localStorage.setItem("routingOrder", JSON.stringify(pipe));
  }, [pipe]);

  /* ─ helpers ─ */
  const unused = STEP_CATALOG.filter((m) => !pipe.includes(m.id));
  const move = (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= pipe.length) return;
    const next = [...pipe];
    [next[idx], next[j]] = [next[j], next[idx]];
    setPipe(next);
  };
  const remove = (id: string) => setPipe((p) => p.filter((x) => x !== id));
  const add = (id: string) => setPipe((p) => [...p, id]);

  return (
    <section>
      <h3 style={{ marginTop: 0 }}>Routing Pipeline</h3>

      {pipe.map((id, i) => {
        const meta = STEP_CATALOG.find((m) => m.id === id)!;
        return (
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
            <span style={{ flex: 1 }}>
              {meta.label} <small>({meta.cat})</small>
            </span>
            <button disabled={i === 0} onClick={() => move(i, -1)}>
              ↑
            </button>
            <button
              disabled={i === pipe.length - 1}
              onClick={() => move(i, 1)}
              style={{ marginLeft: 4 }}
            >
              ↓
            </button>
            <button onClick={() => remove(id)} style={{ marginLeft: 4 }}>
              ✕
            </button>
          </div>
        );
      })}

      {unused.length > 0 && (
        <>
          <hr />
          <div style={{ fontSize: 13, marginBottom: 4 }}>Add layer</div>
          {unused.map((m) => (
            <button
              key={m.id}
              onClick={() => add(m.id)}
              style={{ marginRight: 6, marginBottom: 6 }}
            >
              {m.label}
            </button>
          ))}
        </>
      )}
    </section>
  );
}
