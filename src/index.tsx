import React from "react";
import * as ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css";

/* ────── localStorage sanity sweep ────── */
const cap = (key: string, maxBytes: number) => {
  const raw = localStorage.getItem(key);
  if (raw && raw.length > maxBytes) localStorage.removeItem(key);
};
const safeJSON = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    localStorage.removeItem(key);
    return fallback;
  }
};

cap("demoChatMessages", 200_000);    // ~200 KB max
safeJSON<boolean>("sidePanelOpen", true);
safeJSON<string[]>("routingOrder", []);  // ensures parseable array
/* ─────────────────────────────────────── */

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <ErrorBoundary>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ErrorBoundary>
);
