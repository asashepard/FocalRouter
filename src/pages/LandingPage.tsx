import React from "react";
import SidePanel from "../components/SidePanel";
import RightPanel from "../components/RightPanel";
import DemoChat from "../components/DemoChat";

export default function LandingPage() {
  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <SidePanel />
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: 24,
          overflow: "auto"
        }}
      >
        <DemoChat />
      </div>
      <RightPanel />
    </div>
  );
}
