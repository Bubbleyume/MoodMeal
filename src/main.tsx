import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
// Note: styles/index.css is compiled separately by the Tailwind CLI (see
// scripts/build.mjs / scripts/dev.mjs) and linked directly in index.html —
// it is intentionally not imported here to avoid esbuild bundling the raw,
// pre-Tailwind CSS text into a second, non-functional stylesheet.

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Root element (#root) not found in index.html");
}

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
