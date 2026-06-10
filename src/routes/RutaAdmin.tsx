import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RutaAdmin({ children }: { children: React.ReactNode }) {
    const { user, perfil, cargando } = useAuth();

    if (cargando) {
        return <div className="min-h-screen bg-slate-100 p-6">Cargando...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (perfil?.rol !== "admin") {
        return <Navigate to="/" replace />;
    }

    return children;
}