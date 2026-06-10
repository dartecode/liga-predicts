import { useEffect, useState } from "react";
import { guardarPrediccion, obtenerPrediccionUsuario } from "../services/prediccionesService";
import type { Usuario } from "../types/Usuario";

interface Props {
    partidoId: string;
    usuario: Usuario;
    onGuardado?: () => void;
}


export default function PrediccionForm({ partidoId, usuario, onGuardado }: Props) {
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
        if (golesLocal === "" || golesVisitante === "") {
            setMensaje("Ingresa ambos marcadores");
            return;
        }

        setGuardando(true);
        setMensaje("");

        try {
            await guardarPrediccion({
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
            });

            setMensaje("Predicción guardada");
            onGuardado?.();
        } catch (error) {
            console.error(error);
            setMensaje("Error al guardar la predicción");
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="mt-4 rounded-xl border border-slate-700 bg-slate-900 p-6">
            <p className="mb-4 text-center text-xl font-semibold text-slate-200">
                Tu predicción
            </p>

            <div className="flex items-center justify-center gap-4">
                <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={golesLocal}
                    onChange={(e) => {
                        const valor = e.target.value;

                        if (/^\d*$/.test(valor)) {
                            setGolesLocal(valor === "" ? "" : Number(valor));
                        }
                    }}
                    className="h14 w-20 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-center text-white outline-none"
                />

                <span className="text-slate-400">-</span>

                <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={golesVisitante}
                    onChange={(e) => {
                        const valor = e.target.value;

                        if (/^\d*$/.test(valor)) {
                            setGolesVisitante(valor === "" ? "" : Number(valor));
                        }
                    }}
                    className="h14 w-20 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-center text-white outline-none"
                />

                <button
                    onClick={handleGuardar}
                    disabled={guardando}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
                >
                    {guardando ? "Guardando..." : "Guardar"}
                </button>
            </div>

            {mensaje && (
                <p className="mt-3 text-sm text-slate-300">
                    {mensaje}
                </p>
            )}
        </div>
    );
}