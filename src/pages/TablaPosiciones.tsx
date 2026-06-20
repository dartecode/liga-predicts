import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import type { Posicion } from "../types/Posicion";

const TablaPosicionesSkeleton = () => {
    return (
        <div className="space-y-4 animate-pulse">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px]">
                        <thead>
                            <tr className="bg-slate-100">
                                <th className="px-4 py-4">
                                    <div className="mx-auto h-4 w-6 rounded bg-slate-200" />
                                </th>
                                <th className="px-4 py-4">
                                    <div className="h-4 w-24 rounded bg-slate-200" />
                                </th>
                                <th className="px-4 py-4">
                                    <div className="mx-auto h-4 w-16 rounded bg-slate-200" />
                                </th>
                                <th className="px-4 py-4">
                                    <div className="mx-auto h-4 w-16 rounded bg-slate-200" />
                                </th>
                                <th className="px-4 py-4">
                                    <div className="mx-auto h-4 w-20 rounded bg-slate-200" />
                                </th>
                                <th className="px-4 py-4">
                                    <div className="mx-auto h-4 w-16 rounded bg-slate-200" />
                                </th>
                                <th className="px-4 py-4">
                                    <div className="mx-auto h-4 w-24 rounded bg-slate-200" />
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {[1, 2, 3, 4, 5].map((item) => (
                                <tr key={item} className="border-t border-slate-100">
                                    <td className="px-4 py-4">
                                        <div className="mx-auto h-6 w-8 rounded bg-slate-200" />
                                    </td>

                                    <td className="px-4 py-4">
                                        <div className="h-5 w-40 rounded bg-slate-200" />
                                    </td>

                                    <td className="px-4 py-4">
                                        <div className="mx-auto h-5 w-10 rounded bg-slate-200" />
                                    </td>

                                    <td className="px-4 py-4">
                                        <div className="mx-auto h-5 w-8 rounded bg-slate-200" />
                                    </td>

                                    <td className="px-4 py-4">
                                        <div className="mx-auto h-5 w-8 rounded bg-slate-200" />
                                    </td>

                                    <td className="px-4 py-4">
                                        <div className="mx-auto h-5 w-8 rounded bg-slate-200" />
                                    </td>

                                    <td className="px-4 py-4">
                                        <div className="mx-auto h-5 w-8 rounded bg-slate-200" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="rounded-xl bg-white p-4 shadow-sm">
                <div className="mb-3 h-4 w-40 rounded bg-slate-200" />
                <div className="space-y-2">
                    <div className="h-4 w-64 rounded bg-slate-200" />
                    <div className="h-4 w-72 rounded bg-slate-200" />
                    <div className="h-4 w-60 rounded bg-slate-200" />
                </div>
            </div>
        </div>
    );
};

export default function TablaPosiciones() {
    const [tabla, setTabla] = useState<Posicion[]>([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        const cargarTabla = async () => {
            try {
                setCargando(true);

                const snap = await getDocs(collection(db, "tabla_posiciones"));

                const data: Posicion[] = snap.docs.map((doc) => ({
                    id: doc.id,
                    ...(doc.data() as Omit<Posicion, "id">),
                }));

                data.sort((a, b) => {
                    if (b.puntos !== a.puntos) return b.puntos - a.puntos;
                    if (b.exactos !== a.exactos) return b.exactos - a.exactos;
                    if (b.acertados !== a.acertados) {
                        return b.acertados - a.acertados;
                    }

                    return a.nombreUsuario.localeCompare(b.nombreUsuario);
                });

                setTabla(data);
            } catch (error) {
                console.error("Error cargando tabla:", error);
            } finally {
                setCargando(false);
            }
        };

        cargarTabla();
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-6">
            <div className="mx-auto max-w-5xl">
                <h1 className="mb-6 text-3xl font-bold text-slate-800">
                    🏆 Tabla de Posiciones
                </h1>

                {cargando ? (
                    <TablaPosicionesSkeleton />
                ) : (
                    <>
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[700px]">
                                    <thead>
                                        <tr className="bg-slate-100 text-sm font-semibold text-slate-700">
                                            <th className="px-4 py-4 text-center">#</th>
                                            <th className="px-4 py-4 text-left">Usuario</th>
                                            <th className="px-4 py-4 text-center">Puntos</th>
                                            <th className="px-4 py-4 text-center">Exactos</th>
                                            <th className="px-4 py-4 text-center">Acertados</th>
                                            <th className="px-4 py-4 text-center">Fallados</th>
                                            <th className="px-4 py-4 text-center">Pronósticos</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {tabla.map((usuario, index) => (
                                            <tr
                                                key={usuario.id}
                                                className="border-t border-slate-100 hover:bg-slate-50"
                                            >
                                                <td className="px-4 py-4 text-center font-bold">
                                                    {index === 0
                                                        ? "🥇"
                                                        : index === 1
                                                            ? "🥈"
                                                            : index === 2
                                                                ? "🥉"
                                                                : index + 1}
                                                </td>

                                                <td className="px-4 py-4 font-semibold text-slate-800">
                                                    {usuario.nombreUsuario}
                                                </td>

                                                <td className="px-4 py-4 text-center font-bold text-emerald-600">
                                                    {usuario.puntos}
                                                </td>

                                                <td className="px-4 py-4 text-center">
                                                    {usuario.exactos}
                                                </td>

                                                <td className="px-4 py-4 text-center">
                                                    {usuario.acertados}
                                                </td>

                                                <td className="px-4 py-4 text-center">
                                                    {usuario.fallados}
                                                </td>

                                                <td className="px-4 py-4 text-center">
                                                    {usuario.pronosticos}
                                                </td>
                                            </tr>
                                        ))}

                                        {tabla.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={7}
                                                    className="px-4 py-10 text-center text-slate-500"
                                                >
                                                    No hay posiciones disponibles.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="mt-4 rounded-xl bg-white p-4 text-sm text-slate-600 shadow-sm">
                            <p className="font-semibold">Criterios de desempate:</p>

                            <ol className="mt-2 list-decimal pl-5">
                                <li>Mayor cantidad de puntos.</li>
                                <li>Mayor cantidad de resultados exactos.</li>
                                <li>Mayor cantidad de resultados acertados.</li>
                            </ol>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}