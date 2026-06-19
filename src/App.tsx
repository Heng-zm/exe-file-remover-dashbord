import { HashRouter, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Toaster } from "@/components/ui/sonner";
import { LoadingScreen } from "@/components/common/LoadingScreen";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useTelegram } from "@/hooks/useTelegram";
import { Dashboard } from "@/pages/Dashboard";
import { DeveloperDashboard } from "@/pages/DeveloperDashboard";
import { Feedback } from "@/pages/Feedback";
import { GroupDetail } from "@/pages/GroupDetail";
import { Groups } from "@/pages/Groups";
import { ScannerTest } from "@/pages/ScannerTest";
import { Settings } from "@/pages/Settings";

function AppRoutes() {
  const { loading, error } = useAuth();
  useTelegram();

  if (loading || error === "Please open this app from Telegram.") return <LoadingScreen error={error} />;
  if (error) return <LoadingScreen error={error} />;

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Dashboard />} />
        <Route path="groups" element={<Groups />} />
        <Route path="groups/:chatId" element={<GroupDetail />} />
        <Route path="scan" element={<ScannerTest />} />
        <Route path="feedback" element={<Feedback />} />
        <Route path="developer" element={<DeveloperDashboard />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <AppRoutes />
        <Toaster position="top-center" richColors closeButton />
      </HashRouter>
    </AuthProvider>
  );
}
