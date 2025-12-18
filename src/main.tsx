// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";

import AppShell from "./AppShell";
import DemoHub from "./pages/DemoHub";

import "./index.css";

function Root() {
  const pathname = typeof window !== "undefined" ? window.location.pathname : "/";
  const isDemoPath =
    pathname === "/" || pathname === "/demo" || pathname.startsWith("/demo/");

  // Always show the gate on the public marketing entry points
  if (isDemoPath) {
    return <DemoHub />;
  }

  // Everything else (internal shell)
  return <AppShell />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
