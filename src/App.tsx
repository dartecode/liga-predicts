import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import RutaAdmin from "./routes/RutaAdmin";

import Login from "./pages/Login";
import Home from "./pages/Home";
import MisPronosticos from "./pages/MisPronosticos";
import MainLayout from "./layouts/MainLayout";
import AdminPartidos from "./pages/AdminPartidos";
import TablaPosiciones from "./pages/TablaPosiciones";

import "./index.css";

function AppContent() {
  const { user, cargando } = useAuth();

  if (cargando) {
    return <p>Cargando...</p>;
  }

  return (
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
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}