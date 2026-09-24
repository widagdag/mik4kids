import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { Toaster } from "sonner";

import "./index.css";
import { AuthProvider } from "@/lib/auth";
import Landing from "@/pages/Landing";
import { AuthWithSuspense as Auth } from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Catalog from "@/pages/Catalog";
import LearnSurah from "@/pages/LearnSurah";
import Quiz from "@/pages/Quiz";
import MyContent from "@/pages/MyContent";
import NotFound from "@/pages/NotFound";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
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
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
