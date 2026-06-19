# EXE File Remover Telegram Mini App Frontend

Modern Telegram Mini App frontend for the EXE File Remover Security Bot.

## Stack

- React + TypeScript + Vite
- Tailwind CSS
- shadcn/ui-style components
- Radix primitives
- lucide-react icons
- Telegram WebApp SDK via `https://telegram.org/js/telegram-web-app.js`
- Sonner toasts
- HashRouter for safe static hosting

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open the app from Telegram. Outside Telegram, the app intentionally shows:

```txt
Please open this app from Telegram.
```

## Environment

```env
VITE_API_BASE_URL=https://exe-file-remover.onrender.com
# Optional backward-compatible alias:
VITE_API_BASE=https://exe-file-remover.onrender.com
```

Vite exposes only `VITE_*` variables to the browser bundle, so do not put secrets here.

## Build

```bash
npm run build
npm run preview
```

## API integration updated from README_API

All protected requests go through `src/lib/api.ts`.

Every protected request now sends the API guide's preferred header plus backward-compatible aliases:

```http
X-Telegram-Init-Data: <window.Telegram.WebApp.initData>
X-TMA-Init-Data: <window.Telegram.WebApp.initData>
X-Telegram-Web-App-Data: <window.Telegram.WebApp.initData>
Authorization: tma <window.Telegram.WebApp.initData>
Content-Type: application/json
```

Important updates included:

- First session call uses `POST /api/bootstrap` with `{}` body.
- API base supports `VITE_API_BASE_URL` and legacy `VITE_API_BASE`.
- Scanner sends `{ file_name, mime_type }` to `POST /api/scan/name` and reads nested `response.scan`.
- Formats use `POST /api/groups/{chat_id}/formats/{allowed|blocked}` with `{ mode: "append"|"replace", extensions: [...] }`.
- Individual format removal is implemented by replacing the extension list because the API guide exposes POST append/replace, not DELETE per extension.
- Group settings support `strictness: standard | high | strict` and `auto_action_mode: off | warn | smart | ban`.
- Feedback sends `{ text }` to `POST /api/feedback`.
- Group Logs tab uses `/api/groups/{chat_id}/admin-logs`.
- Developer dashboard includes owner-only `/api/server/log` reader and clear action.
- Runtime config patch sends `trusted_file_hash_whitelist_enabled`, `trusted_hash_max_download_bytes`, and `max_trusted_file_hashes`.

## shadcn setup commands

This project already includes shadcn-style component files under `src/components/ui`. If you want to regenerate with the official CLI in a fresh project, use:

```bash
npm create vite@latest exe-remover-miniapp -- --template react-ts
cd exe-remover-miniapp
npm install -D tailwindcss postcss autoprefixer tailwindcss-animate
npx tailwindcss init -p
npx shadcn@latest init
npx shadcn@latest add button card badge tabs dialog sheet dropdown-menu input label switch select table skeleton alert sonner textarea
npm install lucide-react react-router-dom sonner
```


## 1.0.1 bug fixes and performance improvements

- Split routes into lazy-loaded chunks so the first Telegram WebView load is much smaller.
- Added Vite manual chunks for React, Radix UI, and vendor code.
- Added API request timeout handling, safe JSON parsing, GET cache, and in-flight GET request de-duplication.
- Cleared API cache automatically after mutations so saved settings, formats, hashes, incidents, and logs refresh correctly.
- Reduced duplicate dashboard group requests by using `/api/bootstrap` groups first.
- Improved `useApi` to ignore stale responses and avoid state updates after unmount.
- Hardened Telegram theme/init/MainButton handling for older Telegram clients.
- Added safer chunk-load failure fallback so Telegram shows a readable error instead of a blank screen.
- Fixed unsafe URL decode edge cases for group IDs.
- Improved formats manager duplicate handling and remove-by-replace behavior.
- Disabled unsupported incident action buttons when the API returns `action_supported: false`.
- Improved mobile viewport height, tap behavior, and Telegram theme-color syncing.

## Backend requirements

Your backend should:

1. Set `MINI_APP_API_ENABLED=true`.
2. Validate signed Telegram `window.Telegram.WebApp.initData` with the bot token.
3. Return only groups/channels already known or linked with the bot.
4. Enable CORS for the deployed Mini App domain with `MINI_APP_CORS_ORIGINS`.
5. Return `401` for expired/invalid Telegram sessions.
6. Return `403` for users who are not group admins or not in `BOT_OWNER_IDS`.
7. Include `is_developer` in `/api/bootstrap` so the frontend can show the Developer Dashboard.

## Vercel static deploy

This project includes `vercel.json`:

```txt
Install Command: npm ci --production=false --no-audit --no-fund --legacy-peer-deps
Build Command: npm run build
Output Directory: dist
Node Version: 20.x
```

Set this environment variable in Vercel:

```env
VITE_API_BASE_URL=https://exe-file-remover.onrender.com
```

If Vercel still shows `npm error Exit handler never called`, redeploy with **Clear Build Cache**.

## Render static deploy

Use these settings for a Render Static Site:

```txt
Build command: npm install && npm run build
Publish directory: dist
Environment variable: VITE_API_BASE_URL=https://exe-file-remover.onrender.com
```

This repository also includes `render.yaml` for Blueprint deploys.

## Connect as Telegram Mini App

1. Deploy the frontend to an HTTPS URL.
2. In BotFather, configure your bot's Mini App URL to the deployed frontend URL.
3. Add a bot menu button or inline keyboard button with `web_app` that opens the Mini App.
4. In the backend, verify signed `initData` using the same bot token.
5. Add your frontend domain to `MINI_APP_CORS_ORIGINS`.
6. Test from Telegram mobile and desktop. Browser-only access will not have `window.Telegram.WebApp.initData`.

## Blank screen / Telegram webview fix

This build includes a native HTML boot fallback and a React error boundary. If Telegram or Vercel fails to load the JavaScript bundle, the Mini App shows a visible error card instead of a blank screen.

When redeploying on Vercel:

1. Upload this fixed project.
2. Go to Vercel project → Deployments → Redeploy.
3. Enable **Clear Build Cache**.
4. Confirm these settings:
   - Install Command: `npm ci --production=false --no-audit --no-fund --legacy-peer-deps`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Environment: `VITE_API_BASE_URL=https://exe-file-remover.onrender.com`
5. Open the app from a real Telegram Mini App button, not a normal URL button.

## Notes

- The app does not invent fake groups or channels.
- Empty states are shown until the backend returns data.
- Telegram BackButton and MainButton are integrated.
- Telegram haptic feedback is used on save, scan, and destructive actions.
- The UI maps Telegram theme colors into Tailwind/shadcn CSS variables.
