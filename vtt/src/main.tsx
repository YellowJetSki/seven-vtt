import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

// ── Global Error Handler ──────────────────────────────────────
// Catches unhandled promise rejections and runtime errors
// before they reach the React tree, keeping the app alive.
window.addEventListener("unhandledrejection", (event) => {
  console.warn("[Global] Unhandled promise rejection:", event.reason);
  // Prevent the default browser console warning
  event.preventDefault();
});

window.addEventListener("error", (event) => {
  console.error("[Global] Unhandled runtime error:", event.error ?? event.message);
  // Don't prevent default — let ErrorBoundary catch it too
});

// ── Root Render ───────────────────────────────────────────────

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
