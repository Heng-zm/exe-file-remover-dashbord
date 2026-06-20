import { lazy, Suspense } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Toaster } from "@/components/ui/sonner";
import { LoadingScreen } from "@/components/common/LoadingScreen";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useTelegram } from "@/hooks/useTelegram";

const Dashboard = lazy(() => import("@/pages/Dashboard").then((module) => ({ default: module.Dashboard })));
const DeveloperDashboard = lazy(() => import("@/pages/DeveloperDashboard").then((module) => ({ default: module.DeveloperDashboard })));
const Feedback = lazy(() => import("@/pages/Feedback").then((module) => ({ default: module.Feedback })));
const GroupDetail = lazy(() => import("@/pages/GroupDetail").then((module) => ({ default: module.GroupDetail })));
const Groups = lazy(() => import("@/pages/Groups").then((module) => ({ default: module.Groups })));
const ScannerTest = lazy(() => import("@/pages/ScannerTest").then((module) => ({ default: module.ScannerTest })));
const Settings = lazy(() => import("@/pages/Settings").then((module) => ({ default: module.Settings })));

function AppRoutes() {
  const { loading, error, apiOnline, refresh } = useAuth();
  useTelegram();

  if (loading || error) return <LoadingScreen error={error} apiOnline={apiOnline} onRetry={() => void refresh(true)} />;

  return (
    <Suspense fallback={<LoadingScreen />}>
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
    </Suspense>
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
