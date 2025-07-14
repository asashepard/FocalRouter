import React, { useState } from "react";
import MMLURunner from "./MMLURunner";
import Leaderboard from "./Leaderboard";

export default function RightPanel() {
  const [open, setOpen] = useState<boolean>(() => {
    try {
      return JSON.parse(localStorage.getItem("rightPanelOpen") || "true");
    } catch {
      return true;
    }
  });

  const toggle = () => {
    const next = !open;
    setOpen(next);
    localStorage.setItem("rightPanelOpen", JSON.stringify(next));
  };

  return (
    <div
      style={{
        width: open ? 340 : 40,
        transition: "width .2s",
        borderLeft: "1px solid #eee",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#fafafa",
        overflow: "hidden"
      }}
    >
      <button
        onClick={toggle}
        style={{
          width: 40,
          height: 40,
          border: "none",
          background: "transparent",
          cursor: "pointer"
        }}
        title={open ? "Hide" : "Show"}
      >
        {open ? "»" : "«"}
      </button>
      {open && (
        <div style={{ padding: 16, overflowY: "auto" }}>
          <MMLURunner />
          <hr style={{ margin: "24px 0" }} />
          <Leaderboard />
        </div>
      )}
    </div>
  );
}
