import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/App";
import "@/index.css";

declare global {
  interface Window {
    __MINI_APP_READY__?: boolean;
    __miniAppFatal?: (message: string) => void;
  }
}

function escapeHtml(message: string) {
  return message.replace(/[<>&]/g, (ch) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[ch] || ch));
}

function showNativeFatal(message: string) {
  const root = document.getElementById("root");
  if (!root) return;
  root.innerHTML = `
    <main style="min-height:100vh;min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:20px;background:#17212b;color:#f8fafc;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <section style="width:100%;max-width:420px;border:1px solid rgba(248,113,113,.45);border-radius:24px;background:rgba(15,23,42,.94);padding:22px;box-shadow:0 20px 60px rgba(0,0,0,.35);">
        <div style="font-size:32px;line-height:1">🛡️</div>
        <h1 style="margin:14px 0 8px;font-size:22px;font-weight:800;">EXE Remover Mini App</h1>
        <p style="margin:0 0 14px;color:#cbd5e1;line-height:1.45;">The app could not render. This fallback is shown so Telegram never displays a blank screen.</p>
        <pre style="white-space:pre-wrap;word-break:break-word;margin:0 0 16px;padding:12px;border-radius:14px;background:rgba(239,68,68,.12);color:#fecaca;font-size:12px;">${escapeHtml(message)}</pre>
        <button onclick="location.reload()" style="width:100%;border:0;border-radius:14px;background:#3b82f6;color:white;padding:12px 14px;font-weight:700;">Reload</button>
      </section>
    </main>`;
}

window.__miniAppFatal = showNativeFatal;

window.addEventListener("error", (event) => {
  console.error("Mini App global error", event.error || event.message);
  showNativeFatal(String(event.error?.message || event.message || "Unknown JavaScript error"));
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Mini App unhandled rejection", event.reason);
  showNativeFatal(String(event.reason?.message || event.reason || "Unknown promise rejection"));
});

try {
  const rootElement = document.getElementById("root");
  if (!rootElement) throw new Error("Root element #root was not found.");
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
  // Marks that the React bundle loaded and mounted. UI may still show loading/auth states,
  // but Telegram should never show a raw blank WebView after this point.
  window.__MINI_APP_READY__ = true;
} catch (error) {
  showNativeFatal(error instanceof Error ? error.message : String(error));
}
