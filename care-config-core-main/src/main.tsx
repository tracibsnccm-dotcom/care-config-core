// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";

import AppShell from "./AppShell";
import DemoHub from "./pages/DemoHub.tsx";
import { isDemoUnlocked } from "./lib/demoModeGuard";

import "./index.css";

function Root() {
  // Handle both normal routing and hash routing just in case
  const pathname = typeof window !== "undefined" ? window.location.pathname || "/" : "/";
  const hash = typeof window !== "undefined" ? window.location.hash || "" : "";

  // Root path (/) redirects to /demo for consistent demo entry
  if (pathname === "/" && !hash) {
    if (typeof window !== "undefined") {
      window.location.replace("/demo");
      return null; // Return null while redirecting
    }
  }

  // Only /demo routes go to DemoHub - all other paths require demo unlock or go to AppShell
  const isDemoRoute =
    pathname === "/demo" ||
    pathname.startsWith("/demo/") ||
    hash === "#/demo" ||
    hash.startsWith("#/demo/");

  // Demo routes always go to DemoHub (which handles gating internally)
  if (isDemoRoute) {
    return <DemoHub />;
  }

  // For all other paths, check if demo is unlocked
  // If not unlocked, redirect to /demo to show gate
  const unlocked = isDemoUnlocked();
  if (!unlocked) {
    // Redirect to /demo to show gate
    if (typeof window !== "undefined") {
      window.location.replace("/demo");
      return null; // Return null while redirecting
    }
  }

  // Everything else remains your internal app shell (only if demo is unlocked)
  return <AppShell />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
