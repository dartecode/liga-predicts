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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
            <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white shadow-2xl">

                <div className="rounded-t-3xl bg-gradient-to-r from-red-600 via-white to-emerald-500 p-[2px]">
                    <div className="rounded-t-3xl bg-white px-5 py-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-800">
                                Guardar pronóstico
                            </h2>

                            <button
                                onClick={onCerrar}
                                className="rounded-full bg-white/10 px-3 py-1 text-sm text-slate-800 hover:bg-white/20"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-5">
                    <div className="mb-5 rounded-2xl bg-slate-900 p-4 text-center">
                        <p className="text-sm text-slate-400">Partido</p>

                        <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                            <p className="font-bold text-slate-800">{partido.local}</p>
                            <span className="rounded-full bg-blue-700 px-3 py-1 text-xs font-bold text-slate-800">
                                VS
                            </span>
                            <p className="font-bold text-slate-800">{partido.visitante}</p>
                        </div>
                    </div>

                    <p className="mb-3 text-center text-sm font-semibold text-slate-300">
                        Tu marcador
                    </p>

                    <div className="flex items-center justify-center gap-4">
                        <input
                            type="number"
                            min="0"
                            value={golesLocal}
                            onChange={(e) =>
                                setGolesLocal(e.target.value === "" ? "" : Number(e.target.value))
                            }
                            className="h-16 w-20 rounded-2xl border border-blue-700 bg-slate-900 text-center text-3xl font-black text-slate-800 outline-none focus:border-emerald-500"
                        />

                        <span className="text-3xl font-black text-slate-800">-</span>

                        <input
                            type="number"
                            min="0"
                            value={golesVisitante}
                            onChange={(e) =>
                                setGolesVisitante(e.target.value === "" ? "" : Number(e.target.value))
                            }
                            className="h-16 w-20 rounded-2xl border border-blue-700 bg-slate-900 text-center text-3xl font-black text-slate-800 outline-none focus:border-emerald-500"
                        />
                    </div>

                    <button
                        onClick={onGuardar}
                        disabled={guardando}
                        className="mt-6 w-full rounded-2xl bg-emerald-500 py-3 font-bold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
                    >
                        {guardando ? "Guardando..." : "Guardar pronóstico"}
                    </button>

                    {mensaje && (
                        <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-center text-sm font-semibold text-emerald-400">
                            ✓ {mensaje}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}