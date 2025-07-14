import React, { useState } from "react";
import ApiKeysForm from "./ApiKeysForm";
import RoutingDesigner from "./RoutingDesigner";

export default function SidePanel() {
  const [open, setOpen] = useState<boolean>(() => {
    try {
      return JSON.parse(localStorage.getItem("sidePanelOpen") || "true");
    } catch {
      return true;
    }
  });

  const toggle = () => {
    const next = !open;
    setOpen(next);
    localStorage.setItem("sidePanelOpen", JSON.stringify(next));
  };

  return (
    <div
      style={{
        width: open ? 280 : 40,
        transition: "width .2s",
        borderRight: "1px solid #eee",
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
          cursor: "pointer",
          alignSelf: "flex-end"
        }}
        title={open ? "Hide" : "Show"}
      >
        {open ? "«" : "»"}
      </button>

      {open && (
        <div style={{ padding: 16, overflowY: "auto" }}>
          <ApiKeysForm />
          <hr style={{ margin: "24px 0" }} />
          <RoutingDesigner />
        </div>
      )}
    </div>
  );
}
