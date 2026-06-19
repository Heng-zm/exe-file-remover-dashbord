export type TelegramThemeParams = Record<string, string | undefined>;

type MainButton = {
  text?: string;
  isVisible?: boolean;
  setText: (text: string) => void;
  show: () => void;
  hide: () => void;
  enable: () => void;
  disable: () => void;
  showProgress: (leaveActive?: boolean) => void;
  hideProgress: () => void;
  onClick: (callback: () => void) => void;
  offClick: (callback: () => void) => void;
};

type BackButton = {
  isVisible?: boolean;
  show: () => void;
  hide: () => void;
  onClick: (callback: () => void) => void;
  offClick: (callback: () => void) => void;
};

type HapticFeedback = {
  impactOccurred: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
  notificationOccurred: (type: "error" | "success" | "warning") => void;
  selectionChanged: () => void;
};

export type TelegramWebApp = {
  initData: string;
  initDataUnsafe?: {
    query_id?: string;
    user?: {
      id?: number;
      first_name?: string;
      last_name?: string;
      username?: string;
      language_code?: string;
      is_premium?: boolean;
      photo_url?: string;
    };
    start_param?: string;
  };
  colorScheme?: "light" | "dark";
  themeParams?: TelegramThemeParams;
  version?: string;
  platform?: string;
  isExpanded?: boolean;
  viewportHeight?: number;
  viewportStableHeight?: number;
  MainButton?: MainButton;
  BackButton?: BackButton;
  HapticFeedback?: HapticFeedback;
  ready: () => void;
  expand: () => void;
  close: () => void;
  enableClosingConfirmation?: () => void;
  disableClosingConfirmation?: () => void;
  onEvent?: (eventType: string, eventHandler: () => void) => void;
  offEvent?: (eventType: string, eventHandler: () => void) => void;
};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

export function getTelegramWebApp() {
  return window.Telegram?.WebApp;
}

export function isTelegramWebApp() {
  const webApp = getTelegramWebApp();
  return Boolean(webApp?.initData && webApp.initData.length > 0);
}

export function getInitData() {
  return getTelegramWebApp()?.initData || "";
}

function hexToHsl(hex?: string) {
  if (!hex) return undefined;
  const clean = hex.replace("#", "").trim();
  if (![3, 6].includes(clean.length)) return undefined;
  const normalized = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function applyTelegramTheme() {
  const webApp = getTelegramWebApp();
  const root = document.documentElement;
  const params = webApp?.themeParams || {};
  root.classList.toggle("dark", webApp?.colorScheme === "dark");

  const mappings: Array<[string, string | undefined]> = [
    ["--background", hexToHsl(params.bg_color)],
    ["--foreground", hexToHsl(params.text_color)],
    ["--card", hexToHsl(params.secondary_bg_color || params.bg_color)],
    ["--card-foreground", hexToHsl(params.text_color)],
    ["--popover", hexToHsl(params.secondary_bg_color || params.bg_color)],
    ["--popover-foreground", hexToHsl(params.text_color)],
    ["--primary", hexToHsl(params.button_color || params.link_color)],
    ["--primary-foreground", hexToHsl(params.button_text_color)],
    ["--muted", hexToHsl(params.secondary_bg_color)],
    ["--muted-foreground", hexToHsl(params.hint_color)],
    ["--accent", hexToHsl(params.secondary_bg_color)],
    ["--accent-foreground", hexToHsl(params.text_color)],
    ["--destructive", hexToHsl(params.destructive_text_color)],
    ["--ring", hexToHsl(params.link_color || params.button_color)],
  ];

  mappings.forEach(([name, value]) => {
    if (value) root.style.setProperty(name, value);
  });
}

export function initTelegramApp() {
  const webApp = getTelegramWebApp();
  if (!webApp) return;
  applyTelegramTheme();
  webApp.ready();
  webApp.expand();
  webApp.onEvent?.("themeChanged", applyTelegramTheme);
}

export function haptic(type: "success" | "warning" | "error" | "light" | "medium" = "light") {
  const feedback = getTelegramWebApp()?.HapticFeedback;
  try {
    if (!feedback) return;
    if (type === "success" || type === "warning" || type === "error") {
      feedback.notificationOccurred(type);
    } else {
      feedback.impactOccurred(type);
    }
  } catch {
    // Telegram haptics are best-effort only.
  }
}

export function configureMainButton(options: {
  text: string;
  visible: boolean;
  loading?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  const button = getTelegramWebApp()?.MainButton;
  if (!button) return () => undefined;
  button.setText(options.text);
  if (options.visible) button.show();
  else button.hide();
  if (options.disabled) button.disable();
  else button.enable();
  if (options.loading) button.showProgress(true);
  else button.hideProgress();
  button.onClick(options.onClick);
  return () => {
    button.offClick(options.onClick);
    button.hideProgress();
    button.hide();
  };
}
