import { useEffect, useState } from "react";
import {
    guardarPrediccion,
    obtenerPrediccionUsuario,
} from "../services/prediccionesService";
import type { Usuario } from "../types/Usuario";

interface Props {
    partidoId: string;
    usuario: Usuario;
    onGuardado?: (pronosticoActualizado: any) => void;
}

export default function PrediccionForm({
    partidoId,
    usuario,
    onGuardado,
}: Props) {
    const [golesLocal, setGolesLocal] = useState<number | "">("");
    const [golesVisitante, setGolesVisitante] = useState<number | "">("");
    const [guardando, setGuardando] = useState(false);
    const [mensaje, setMensaje] = useState("");

    useEffect(() => {
        const cargarPrediccion = async () => {
            const prediccion = await obtenerPrediccionUsuario(partidoId, usuario.id);

            if (prediccion) {
                setGolesLocal(prediccion.golesLocal);
                setGolesVisitante(prediccion.golesVisitante);
            }
        };

        cargarPrediccion();
    }, [partidoId, usuario.id]);

    const handleGuardar = async () => {
        if (guardando) return;

        if (golesLocal === "" || golesVisitante === "") {
            setMensaje("Ingresa ambos marcadores");
            return;
        }

        setGuardando(true);
        setMensaje("");

        try {
            const pronosticoActualizado = {
                partidoId,
                usuarioId: usuario.id,
                nombreUsuario: usuario.usuario,
                golesLocal: Number(golesLocal),
                golesVisitante: Number(golesVisitante),
                fechaPrediccion: new Date(),
                fechaActualizacion: new Date(),
                puntos: 0,
                resultadoExacto: false,
                partidoAcertado: false,
            };
            await guardarPrediccion(pronosticoActualizado);

            setMensaje("Predicción guardada correctamente");
            onGuardado?.(pronosticoActualizado);
        } catch (error) {
            console.error(error);
            setMensaje("Error al guardar la predicción");
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="mb-4 text-center text-sm font-semibold text-slate-600">
                Tu marcador
            </p>

            <div className="flex items-center justify-center gap-4">
                <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={golesLocal}
                    disabled={guardando}
                    onChange={(e) => {
                        const valor = e.target.value;

                        if (/^\d*$/.test(valor)) {
                            setGolesLocal(valor === "" ? "" : Number(valor));
                        }
                    }}
                    className="h-20 w-24 rounded-2xl border border-slate-300 bg-slate-50 text-center text-4xl font-black text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                />

                <span className="text-3xl font-black text-slate-500">-</span>

                <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={golesVisitante}
                    disabled={guardando}
                    onChange={(e) => {
                        const valor = e.target.value;

                        if (/^\d*$/.test(valor)) {
                            setGolesVisitante(valor === "" ? "" : Number(valor));
                        }
                    }}
                    className="h-20 w-24 rounded-2xl border border-slate-300 bg-slate-50 text-center text-4xl font-black text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                />
            </div>

            <button
                onClick={handleGuardar}
                disabled={guardando}
                className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
            >
                {guardando && (
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                )}

                {guardando ? "Guardando..." : "Guardar pronóstico"}
            </button>

            {mensaje && (
                <p
                    className={`mt-4 rounded-xl p-3 text-center text-sm font-semibold ${mensaje.includes("Error") || mensaje.includes("Ingresa")
                        ? "border border-red-200 bg-red-50 text-red-700"
                        : "border border-blue-200 bg-blue-50 text-blue-700"
                        }`}
                >
                    {mensaje}
                </p>
            )}
        </div>
    );
}