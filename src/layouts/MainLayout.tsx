import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, perfil } = useAuth();

  const [mostrarModal, setMostrarModal] = useState(false);
  const [cerrando, setCerrando] = useState(false);

  const activo = (path: string) =>
    location.pathname === path
      ? "text-blue-600 font-bold"
      : "text-slate-600";

  const confirmarCerrarSesion = async () => {
    try {
      setCerrando(true);
      await logout();
      navigate("/login");
    } finally {
      setCerrando(false);
      setMostrarModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex gap-6">
            <Link className={activo("/")} to="/">
              Inicio
            </Link>

            <Link className={activo("/mis-pronosticos")} to="/mis-pronosticos">
              Mis Pronósticos
            </Link>

            <Link className={activo("/tabla")} to="/tabla">
              Tabla
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs text-slate-500">Conectado como</span>
              <span className="font-semibold text-slate-800">
                {perfil?.usuario}
              </span>
            </div>

            <button
              onClick={() => setMostrarModal(true)}
              className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </nav>

      <main>
        <Outlet />
      </main>

      {mostrarModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-slate-800">
              Cerrar sesión
            </h2>

            <p className="mt-2 text-slate-600">
              ¿Seguro que deseas cerrar sesión?
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setMostrarModal(false)}
                disabled={cerrando}
                className="rounded-xl border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
              >
                Cancelar
              </button>

              <button
                onClick={confirmarCerrarSesion}
                disabled={cerrando}
                className="rounded-xl bg-red-500 px-4 py-2 font-semibold text-white hover:bg-red-600 disabled:opacity-60"
              >
                {cerrando ? "Cerrando..." : "Sí, cerrar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}