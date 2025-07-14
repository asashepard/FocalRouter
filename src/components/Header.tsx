import React from "react";
import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header
      style={{
        padding: "12px 24px",
        borderBottom: "1px solid #eee",
        display: "flex",
        justifyContent: "space-between"
      }}
    >
      <Link to="/" style={{ fontWeight: 600, textDecoration: "none" }}>
        FocalRouter: Open-Source LLM Routing Assembly
      </Link>
      <a
        href="https://github.com/asashepard/FocalRouter"
        target="_blank"
        rel="noreferrer"
      >
        GitHub
      </a>
    </header>
  );
}
