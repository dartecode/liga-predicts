interface Props {
    abierto: boolean;
    onCerrar: () => void;
    partido: any;
    golesLocal: number | "";
    golesVisitante: number | "";
    setGolesLocal: (valor: number | "") => void;
    setGolesVisitante: (valor: number | "") => void;
    onGuardar: () => void;
    guardando: boolean;
    mensaje: string;
}

export default function PrediccionModal({
    abierto,
    onCerrar,
    partido,
    golesLocal,
    golesVisitante,
    setGolesLocal,
    setGolesVisitante,
    onGuardar,
    guardando,
    mensaje,
}: Props) {
    if (!abierto) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
                <div className="mb-5 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">
                            Guardar pronóstico
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Ingresa el marcador que crees que tendrá el partido.
                        </p>
                    </div>

                    <button
                        onClick={onCerrar}
                        className="rounded-full px-3 py-1 text-lg font-bold text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                        ✕
                    </button>
                </div>

                <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
                    <p className="text-sm text-slate-500">Partido</p>

                    <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                        <p className="font-bold text-slate-800">{partido.local}</p>

                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                            VS
                        </span>

                        <p className="font-bold text-slate-800">{partido.visitante}</p>
                    </div>
                </div>

                <p className="mb-3 text-center text-sm font-semibold text-slate-600">
                    Tu marcador
                </p>

                <div className="flex items-center justify-center gap-4">
                    <input
                        type="number"
                        min="0"
                        inputMode="numeric"
                        value={golesLocal}
                        onChange={(e) =>
                            setGolesLocal(e.target.value === "" ? "" : Number(e.target.value))
                        }
                        className="h-16 w-20 rounded-2xl border border-slate-300 bg-white text-center text-3xl font-black text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />

                    <span className="text-3xl font-black text-slate-700">-</span>

                    <input
                        type="number"
                        min="0"
                        inputMode="numeric"
                        value={golesVisitante}
                        onChange={(e) =>
                            setGolesVisitante(
                                e.target.value === "" ? "" : Number(e.target.value)
                            )
                        }
                        className="h-16 w-20 rounded-2xl border border-slate-300 bg-white text-center text-3xl font-black text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                </div>

                <button
                    onClick={onGuardar}
                    disabled={guardando}
                    className="mt-6 w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                >
                    {guardando ? "Guardando..." : "Guardar pronóstico"}
                </button>

                {mensaje && (
                    <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-3 text-center text-sm font-semibold text-blue-700">
                        ✓ {mensaje}
                    </div>
                )}
            </div>
        </div>
    );
}