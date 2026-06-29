import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import RutaAdmin from "./routes/RutaAdmin";
import PwaUpdatePrompt from "./components/PwaUpdatePrompt";

import Login from "./pages/Login";
import Home from "./pages/Home";
import MisPronosticos from "./pages/MisPronosticos";
import MainLayout from "./layouts/MainLayout";
import AdminPartidos from "./pages/AdminPartidos";
import TablaPosiciones from "./pages/TablaPosiciones";

import "./index.css";

function AppLoading() {
  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6">
      <div className="mx-auto max-w-5xl space-y-6 animate-pulse">
        {/* Header / nav skeleton */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="h-8 w-32 rounded bg-slate-200" />

            <div className="hidden gap-3 sm:flex">
              <div className="h-5 w-20 rounded bg-slate-200" />
              <div className="h-5 w-28 rounded bg-slate-200" />
              <div className="h-5 w-24 rounded bg-slate-200" />
            </div>

            <div className="h-9 w-24 rounded-xl bg-slate-200" />
          </div>
        </div>

        {/* Título */}
        <div>
          <div className="mb-2 h-4 w-24 rounded bg-slate-200" />
          <div className="h-8 w-64 rounded bg-slate-200" />
        </div>

        {/* Cards */}
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-3">
                <div className="h-6 w-64 rounded bg-slate-200" />
                <div className="h-4 w-36 rounded bg-slate-200" />
                <div className="h-4 w-48 rounded bg-slate-200" />
              </div>

              <div className="h-10 w-32 rounded-xl bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AppContent() {
  const { user, cargando } = useAuth();

  if (cargando) {
    return <AppLoading />;
  }

  return (
    <>
    <BrowserRouter>
      <Routes>
        {!user ? (
          <>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          <>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/mis-pronosticos" element={<MisPronosticos />} />
              <Route path="/tabla" element={<TablaPosiciones />} />

              <Route
                path="/admin/partidos"
                element={
                  <RutaAdmin>
                    <AdminPartidos />
                  </RutaAdmin>
                }
              />
            </Route>

            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
    <PwaUpdatePrompt />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}