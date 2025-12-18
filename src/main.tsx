// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";

import AppShell from "./AppShell";
import DemoHub from "./pages/DemoHub.tsx";

import "./index.css";

function Root() {
  // Handle both normal routing and hash routing just in case
  const pathname = typeof window !== "undefined" ? window.location.pathname || "/" : "/";
  const hash = typeof window !== "undefined" ? window.location.hash || "" : "";

  const isDemoEntry =
    pathname === "/" ||
    pathname === "/demo" ||
    pathname.startsWith("/demo/") ||
    hash === "#/" ||
    hash.startsWith("#/demo");

  // Force the gate to be the first thing users see on public entry links
  if (isDemoEntry) {
    return <DemoHub />;
  }

  // Everything else remains your internal app shell
  return <AppShell />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
