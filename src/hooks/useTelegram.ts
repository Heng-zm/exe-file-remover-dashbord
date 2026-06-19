import { useEffect, useMemo, useState } from "react";
import { applyTelegramTheme, getTelegramWebApp, initTelegramApp, isTelegramWebApp } from "@/lib/telegram";

export function useTelegram() {
  const [themeTick, setThemeTick] = useState(0);

  useEffect(() => {
    initTelegramApp();
    const webApp = getTelegramWebApp();
    const handler = () => {
      applyTelegramTheme();
      setThemeTick((value) => value + 1);
    };
    webApp?.onEvent?.("themeChanged", handler);
    webApp?.onEvent?.("viewportChanged", handler);
    return () => {
      webApp?.offEvent?.("themeChanged", handler);
      webApp?.offEvent?.("viewportChanged", handler);
    };
  }, []);

  return useMemo(() => {
    const webApp = getTelegramWebApp();
    return {
      webApp,
      isTelegram: isTelegramWebApp(),
      initData: webApp?.initData || "",
      user: webApp?.initDataUnsafe?.user,
      startParam: webApp?.initDataUnsafe?.start_param,
      colorScheme: webApp?.colorScheme || "light",
      platform: webApp?.platform || "unknown",
      themeTick,
    };
  }, [themeTick]);
}
