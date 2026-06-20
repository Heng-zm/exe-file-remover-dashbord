import { HashRouter, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Toaster } from "@/components/ui/sonner";
import { LoadingScreen } from "@/components/common/LoadingScreen";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
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
  const { loading, error, apiOnline, session, refresh } = useAuth();
  useTelegram();

  if (loading) return <LoadingScreen apiOnline={apiOnline} />;

  // Never render a blank screen after auth/bootstrap. If the backend returns 200 but
  // no usable dashboard/user payload, LoadingScreen shows a clear retry/debug state.
  if (error && !session) {
    return <LoadingScreen error={error} apiOnline={apiOnline} onRetry={() => void refresh(true)} />;
  }

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
        <Route path="*" element={<Dashboard />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <HashRouter>
          <AppRoutes />
          <Toaster position="top-center" richColors closeButton />
        </HashRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
