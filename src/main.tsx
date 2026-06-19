import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/App";
import "@/index.css";

function showNativeFatal(message: string) {
  const root = document.getElementById("root");
  if (!root) return;
  root.innerHTML = `
    <main style="min-height:100vh;min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:20px;background:#0f172a;color:#f8fafc;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <section style="width:100%;max-width:420px;border:1px solid rgba(248,113,113,.45);border-radius:24px;background:rgba(15,23,42,.92);padding:22px;box-shadow:0 20px 60px rgba(0,0,0,.35);">
        <div style="font-size:32px;line-height:1">🛡️</div>
        <h1 style="margin:14px 0 8px;font-size:22px;font-weight:800;">EXE Remover Mini App</h1>
        <p style="margin:0 0 14px;color:#cbd5e1;line-height:1.45;">The app could not start. This fallback is shown so Telegram never displays a blank screen.</p>
        <pre style="white-space:pre-wrap;word-break:break-word;margin:0 0 16px;padding:12px;border-radius:14px;background:rgba(239,68,68,.12);color:#fecaca;font-size:12px;">${message.replace(/[<>&]/g, (ch) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[ch] || ch))}</pre>
        <button onclick="location.reload()" style="width:100%;border:0;border-radius:14px;background:#3b82f6;color:white;padding:12px 14px;font-weight:700;">Reload</button>
      </section>
    </main>`;
}

window.addEventListener("error", (event) => {
  console.error("Mini App global error", event.error || event.message);
  showNativeFatal(String(event.error?.message || event.message || "Unknown JavaScript error"));
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Mini App unhandled rejection", event.reason);
  const message = String(event.reason?.message || event.reason || "Unknown promise rejection");
  if (/chunk|module|import|failed to fetch/i.test(message)) {
    showNativeFatal(message);
  }
});

try {
  const rootElement = document.getElementById("root");
  if (!rootElement) throw new Error("Root element #root was not found.");
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
} catch (error) {
  showNativeFatal(error instanceof Error ? error.message : String(error));
}
