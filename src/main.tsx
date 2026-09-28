import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { Toaster } from "sonner";

import "./index.css";
import { AuthProvider } from "@/lib/auth";
import Landing from "@/pages/Landing";

// Route-level code splitting: each page is its own chunk, so the landing
// page only downloads what it renders (keeps Lighthouse TBT/TTI low).
const Auth = lazy(() => import("@/pages/Auth"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Catalog = lazy(() => import("@/pages/Catalog"));
const LearnSurah = lazy(() => import("@/pages/LearnSurah"));
const Quiz = lazy(() => import("@/pages/Quiz"));
const MyContent = lazy(() => import("@/pages/MyContent"));
const NotFound = lazy(() => import("@/pages/NotFound"));

function PageFallback() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-white"
      role="status"
      aria-live="polite"
    >
      <span className="text-sm text-neutral-400">Loading…</span>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/learn/:surahNumber" element={<LearnSurah />} />
            <Route path="/quiz/:surahNumber" element={<Quiz />} />
            <Route path="/my-content" element={<MyContent />} />
            <Route path="/index.html" element={<Navigate to="/" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster position="bottom-right" richColors closeButton />
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
