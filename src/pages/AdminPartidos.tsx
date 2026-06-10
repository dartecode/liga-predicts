import { useEffect, useState } from "react";
import {
    collection,
    getDocs,
    doc,
    updateDoc,
    query,
    orderBy,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import { calcularPuntosPorPartido } from "../services/tablaPosicionesService";

export default function AdminPartidos() {
    const { perfil, cargando: cargandoAuth } = useAuth();

    const [partidos, setPartidos] = useState<any[]>([]);
    const [cargando, setCargando] = useState(true);

    const cargarPartidos = async () => {
        try {
            const q = query(
                collection(db, "partidos"),
                orderBy("fechaPartido", "asc")
            );

            const snap = await getDocs(q);

            const data = snap.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            setPartidos(data);
        } catch (error) {
            console.error(error);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        if (perfil?.rol === "admin") {
            cargarPartidos();
        } else {
            setCargando(false);
        }
    }, [perfil]);

    const guardarResultado = async (
        partidoId: string,
        resultadoLocal: number,
        resultadoVisitante: number
    ) => {
        await updateDoc(doc(db, "partidos", partidoId), {
            resultadoLocal,
            resultadoVisitante,
            estado: "finalizado",
        });

        await calcularPuntosPorPartido(partidoId);

        await cargarPartidos();
    };

    if (cargandoAuth || cargando) {
        return (
            <div className="min-h-screen bg-slate-100 p-6 text-slate-800">
                Cargando...
            </div>
        );
    }

    if (perfil?.rol !== "admin") {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
                <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
                    <h1 className="text-xl font-bold text-red-700">
                        Acceso denegado
                    </h1>

                    <p className="mt-2 text-red-600">
                        No tienes permisos para acceder a esta sección.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 p-6 text-slate-800">
            <h1 className="mb-6 text-2xl font-bold">
                Administrar partidos
            </h1>

            <div className="space-y-4">
                {partidos.map((partido) => (
                    <PartidoAdminCard
                        key={partido.id}
                        partido={partido}
                        onGuardar={guardarResultado}
                    />
                ))}
            </div>
        </div>
    );
}

function PartidoAdminCard({
    partido,
    onGuardar,
}: {
    partido: any;
    onGuardar: (
        partidoId: string,
        resultadoLocal: number,
        resultadoVisitante: number
    ) => void;
}) {
    const [local, setLocal] = useState(partido.resultadoLocal ?? "");
    const [visitante, setVisitante] = useState(
        partido.resultadoVisitante ?? ""
    );
    const [guardando, setGuardando] = useState(false);

    const guardar = async () => {
        if (local === "" || visitante === "") {
            alert("Ingresa ambos resultados");
            return;
        }

        setGuardando(true);

        try {
            await onGuardar(
                partido.id,
                Number(local),
                Number(visitante)
            );
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <p className="text-sm text-slate-500">
                        Estado:{" "}
                        <span className="font-semibold text-slate-700">
                            {partido.estado}
                        </span>
                    </p>

                    <h2 className="mt-1 text-xl font-bold">
                        {partido.local} vs {partido.visitante}
                    </h2>
                </div>

                <div className="flex items-center gap-3">
                    <input
                        type="number"
                        min="0"
                        inputMode="numeric"
                        value={local}
                        onChange={(e) => setLocal(e.target.value)}
                        className="w-20 rounded-xl border border-slate-300 px-3 py-2 text-center"
                    />

                    <span className="font-bold">-</span>

                    <input
                        type="number"
                        min="0"
                        inputMode="numeric"
                        value={visitante}
                        onChange={(e) => setVisitante(e.target.value)}
                        className="w-20 rounded-xl border border-slate-300 px-3 py-2 text-center"
                    />

                    <button
                        onClick={guardar}
                        disabled={guardando}
                        className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                        {guardando ? "Guardando..." : "Guardar"}
                    </button>
                </div>
            </div>
        </div>
    );
}