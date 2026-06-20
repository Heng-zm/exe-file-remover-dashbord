# Blank Screen Fix Notes

This build fixes the case where `/api/bootstrap` returns HTTP 200 but Telegram still shows a blank Mini App panel.

Changes:

- Removed React lazy route imports so the app no longer depends on extra route chunks.
- Configured Vite with `base: './'` and `inlineDynamicImports: true` so Vercel/Telegram WebView loads one stable JS bundle.
- Added native HTML startup fallback in `index.html` that stays visible if React fails to boot.
- Added global error and unhandled rejection fallbacks that render a visible error card instead of a blank page.
- Changed auth flow to call `/api/bootstrap` first and normalize wrapped response shapes like `data`, `session`, `dashboard`, `result`, or `payload`.
- If `/api/bootstrap` returns 200 but user data is missing, the dashboard shell still renders with an auth warning and Retry button.
- Keeps sending `X-Telegram-Init-Data` and POST body `{ initData }` for backend compatibility.

Vercel settings:

```txt
Install Command: npm ci --production=false --no-audit --no-fund --legacy-peer-deps
Build Command: npm run build
Output Directory: dist
```

Environment:

```env
VITE_API_BASE_URL=https://exe-file-remover.onrender.com
```

After upload, redeploy with **Clear Build Cache**.
