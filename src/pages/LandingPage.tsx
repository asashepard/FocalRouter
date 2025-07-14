import React from "react";
import Header from "../components/Header";
import DemoChat from "../components/DemoChat";

export default function LandingPage() {
  return (
    <>
      <Header />
      <div style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
        <DemoChat />
      </div>
    </>
  );
}
