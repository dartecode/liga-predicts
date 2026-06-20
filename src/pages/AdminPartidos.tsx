import { useEffect, useState } from "react";
import {
    collection,
    getDocs,
    doc,
    setDoc,
    updateDoc,
    query,
    orderBy,
    where,
    Timestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import jsPDF from "jspdf";
import { calcularPuntosPorPartido } from "../services/tablaPosicionesService";

const AdminPartidosSkeleton = () => {
    return (
        <div className="min-h-screen bg-slate-100 p-6">
            <div className="mx-auto max-w-6xl space-y-6 animate-pulse">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="h-9 w-72 rounded bg-slate-200" />

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <div className="h-12 w-40 rounded-xl bg-slate-200" />
                        <div className="h-12 w-28 rounded-xl bg-slate-200" />
                        <div className="h-12 w-44 rounded-xl bg-slate-200" />
                    </div>
                </div>

                <div className="space-y-5">
                    {[1, 2, 3, 4].map((item) => (
                        <div
                            key={item}
                            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                        >
                            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                                <div className="space-y-3">
                                    <div className="h-5 w-24 rounded bg-slate-200" />
                                    <div className="h-4 w-32 rounded bg-slate-200" />
                                    <div className="h-8 w-72 rounded bg-slate-200" />
                                </div>

                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-24 rounded-xl bg-slate-200" />
                                        <div className="h-5 w-4 rounded bg-slate-200" />
                                        <div className="h-12 w-24 rounded-xl bg-slate-200" />
                                    </div>

                                    <div className="h-12 w-28 rounded-xl bg-slate-200" />
                                    <div className="h-12 w-36 rounded-xl bg-slate-200" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default function AdminPartidos() {
    const { perfil, cargando: cargandoAuth } = useAuth();

    const [partidos, setPartidos] = useState<any[]>([]);
    const [cargando, setCargando] = useState(true);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);

    const [local, setLocal] = useState("");
    const [visitante, setVisitante] = useState("");
    const [fechaPartido, setFechaPartido] = useState("");
    const [horaPartido, setHoraPartido] = useState("");

    const [fechaReporte, setFechaReporte] = useState("");

    const [mostrarFaltantes, setMostrarFaltantes] = useState(false);
    const [usuariosFaltantes, setUsuariosFaltantes] = useState<any[]>([]);
    const [partidoFaltantes, setPartidoFaltantes] = useState<any | null>(null);

    const [agregandoPartido, setAgregandoPartido] = useState(false);
    const [generandoReporte, setGenerandoReporte] = useState(false);
    const [partidoGuardandoId, setPartidoGuardandoId] = useState<string | null>(null);

    const cargarPartidos = async () => {
        try {
            setCargando(true);

            const q = query(collection(db, "partidos"), orderBy("fechaPartido", "asc"));

            const snapshot = await getDocs(q);

            const data = snapshot.docs.map((documento) => ({
                id: documento.id,
                ...documento.data(),
            }));

            const ordenados = data.sort((a: any, b: any) => {
                if (a.estado === "pendiente" && b.estado !== "pendiente") return -1;
                if (a.estado !== "pendiente" && b.estado === "pendiente") return 1;

                const fechaA = a.fechaPartido?.toDate?.() ?? new Date(0);
                const fechaB = b.fechaPartido?.toDate?.() ?? new Date(0);

                return fechaA.getTime() - fechaB.getTime();
            });

            setPartidos(ordenados);
        } catch (error) {
            console.error(error);
            alert("Error al cargar partidos");
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarPartidos();
    }, []);

    const agregarPartido = async () => {
        if (agregandoPartido) return;

        if (!local || !visitante || !fechaPartido || !horaPartido) {
            alert("Completa todos los campos");
            return;
        }

        try {
            setAgregandoPartido(true);

            const fechaCompleta = new Date(`${fechaPartido}T${horaPartido}`);

            const snapshot = await getDocs(collection(db, "partidos"));

            const idsNumericos = snapshot.docs
                .map((d) => parseInt(d.id))
                .filter((id) => !isNaN(id));

            const siguienteId =
                idsNumericos.length > 0 ? Math.max(...idsNumericos) + 1 : 1;

            await setDoc(doc(db, "partidos", String(siguienteId)), {
                local,
                visitante,
                fechaPartido: Timestamp.fromDate(fechaCompleta),
                estado: "pendiente",
                resultadoLocal: null,
                resultadoVisitante: null,
            });

            setLocal("");
            setVisitante("");
            setFechaPartido("");
            setHoraPartido("");
            setMostrarFormulario(false);

            await cargarPartidos();
        } catch (error) {
            console.error(error);
            alert("Error al agregar partido");
        } finally {
            setAgregandoPartido(false);
        }
    };

    const guardarResultado = async (
        partidoId: string,
        resultadoLocal: string,
        resultadoVisitante: string
    ) => {
        if (partidoGuardandoId) return;

        if (resultadoLocal === "" || resultadoVisitante === "") {
            alert("Ingresa ambos resultados");
            return;
        }

        try {
            setPartidoGuardandoId(partidoId);

            await updateDoc(doc(db, "partidos", partidoId), {
                resultadoLocal: Number(resultadoLocal),
                resultadoVisitante: Number(resultadoVisitante),
                estado: "finalizado",
            });

            await calcularPuntosPorPartido(partidoId);

            await cargarPartidos();

            alert("Resultado guardado y tabla de posiciones actualizada");
        } catch (error) {
            console.error(error);
            alert("Error al guardar resultado o calcular puntos");
        } finally {
            setPartidoGuardandoId(null);
        }
    };

    const convertirFecha = (fecha: any) => {
        if (fecha?.toDate) {
            return fecha.toDate();
        }

        return new Date(fecha);
    };

    const generarReportePDF = async () => {
        if (generandoReporte) return;

        if (!fechaReporte) {
            alert("Selecciona una fecha para generar el reporte");
            return;
        }

        try {
            setGenerandoReporte(true);

            const calcularPuntosReporte = (partido: any, prediccion: any) => {
                if (
                    partido.resultadoLocal === null ||
                    partido.resultadoLocal === undefined ||
                    partido.resultadoVisitante === null ||
                    partido.resultadoVisitante === undefined
                ) {
                    return 0;
                }

                const realLocal = Number(partido.resultadoLocal);
                const realVisitante = Number(partido.resultadoVisitante);
                const predLocal = Number(prediccion.golesLocal);
                const predVisitante = Number(prediccion.golesVisitante);

                if (predLocal === realLocal && predVisitante === realVisitante) {
                    return 3;
                }

                const resultadoReal =
                    realLocal === realVisitante
                        ? "EMPATE"
                        : realLocal > realVisitante
                            ? "LOCAL"
                            : "VISITANTE";

                const resultadoPrediccion =
                    predLocal === predVisitante
                        ? "EMPATE"
                        : predLocal > predVisitante
                            ? "LOCAL"
                            : "VISITANTE";

                return resultadoReal === resultadoPrediccion ? 1 : 0;
            };

            const docPdf = new jsPDF();

            const fechaSeleccionada = new Date(`${fechaReporte}T00:00:00`);

            const partidosDelDia = partidos.filter((partido) => {
                const fechaPartido = convertirFecha(partido.fechaPartido);

                return (
                    fechaPartido.getFullYear() === fechaSeleccionada.getFullYear() &&
                    fechaPartido.getMonth() === fechaSeleccionada.getMonth() &&
                    fechaPartido.getDate() === fechaSeleccionada.getDate()
                );
            });

            if (partidosDelDia.length === 0) {
                alert("No hay partidos para la fecha seleccionada");
                return;
            }

            let y = 20;

            docPdf.setFontSize(18);
            docPdf.setFont("helvetica", "bold");
            docPdf.text("D3 Predicts", 20, y);

            y += 10;
            docPdf.setFontSize(13);
            docPdf.setFont("helvetica", "normal");
            docPdf.text("Reporte de Pronósticos", 20, y);

            y += 8;
            docPdf.setFontSize(10);
            docPdf.text(`Fecha del reporte: ${fechaReporte}`, 20, y);
            docPdf.text(`Generado: ${new Date().toLocaleString()}`, 20, y + 6);

            y += 20;

            for (const partido of partidosDelDia) {
                const prediccionesSnap = await getDocs(
                    query(collection(db, "predicciones"), where("partidoId", "==", partido.id))
                );

                const predicciones = prediccionesSnap.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as any[];

                if (y > 245) {
                    docPdf.addPage();
                    y = 20;
                }

                const golesLocal = partido.resultadoLocal ?? "-";
                const golesVisitante = partido.resultadoVisitante ?? "-";

                docPdf.setFillColor(41, 128, 185);
                docPdf.rect(20, y, 170, 8, "F");

                docPdf.setTextColor(255, 255, 255);
                docPdf.setFontSize(11);
                docPdf.setFont("helvetica", "bold");
                docPdf.text(`${partido.local} vs ${partido.visitante}`, 23, y + 5.5);

                y += 14;

                docPdf.setTextColor(0, 0, 0);
                docPdf.setFontSize(11);
                docPdf.setFont("helvetica", "bold");
                docPdf.text("Resultado oficial:", 20, y);

                y += 8;

                docPdf.setFont("helvetica", "normal");
                docPdf.text(
                    `${partido.local} ${golesLocal} - ${golesVisitante} ${partido.visitante}`,
                    25,
                    y
                );

                y += 12;

                docPdf.setFillColor(41, 128, 185);
                docPdf.rect(20, y, 170, 8, "F");

                docPdf.setTextColor(255, 255, 255);
                docPdf.setFontSize(10);
                docPdf.setFont("helvetica", "bold");
                docPdf.text("Usuario", 23, y + 5.5);
                docPdf.text("Pronóstico", 85, y + 5.5);
                docPdf.text("Puntos", 165, y + 5.5);

                y += 8;

                docPdf.setTextColor(0, 0, 0);
                docPdf.setFont("helvetica", "normal");

                if (predicciones.length === 0) {
                    docPdf.text("Sin predicciones registradas", 23, y + 6);
                    y += 10;
                } else {
                    predicciones.forEach((prediccion, index) => {
                        if (y > 275) {
                            docPdf.addPage();
                            y = 20;
                        }

                        const puntos = calcularPuntosReporte(partido, prediccion);

                        const usuario =
                            prediccion.nombreUsuario ||
                            prediccion.usuarioEmail ||
                            prediccion.email ||
                            prediccion.usuarioId ||
                            "Usuario";

                        const predLocal = prediccion.golesLocal ?? "-";
                        const predVisitante = prediccion.golesVisitante ?? "-";

                        if (index % 2 === 0) {
                            docPdf.setFillColor(245, 245, 245);
                            docPdf.rect(20, y, 170, 8, "F");
                        }

                        docPdf.setFontSize(9);
                        docPdf.text(String(usuario), 23, y + 5.5);
                        docPdf.text(
                            `${partido.local} ${predLocal} - ${predVisitante} ${partido.visitante}`,
                            85,
                            y + 5.5
                        );
                        docPdf.text(String(puntos), 167, y + 5.5);

                        y += 8;
                    });
                }

                y += 14;
            }

            docPdf.save(`reporte-pronosticos-${fechaReporte}.pdf`);
        } catch (error) {
            console.error(error);
            alert("Error al generar el reporte");
        } finally {
            setGenerandoReporte(false);
        }
    };

    const verFaltantes = async (partido: any) => {
        try {
            const usuariosSnapshot = await getDocs(collection(db, "usuarios"));

            const usuarios = usuariosSnapshot.docs.map((documento) => ({
                id: documento.id,
                ...documento.data(),
            })) as any[];

            const prediccionesSnapshot = await getDocs(
                query(collection(db, "predicciones"), where("partidoId", "==", partido.id))
            );

            const usuariosConPrediccion = prediccionesSnapshot.docs.map(
                (documento) => documento.data().usuarioId
            );

            const faltantes = usuarios.filter(
                (usuario) => !usuariosConPrediccion.includes(usuario.id)
            );

            setPartidoFaltantes(partido);
            setUsuariosFaltantes(faltantes);
            setMostrarFaltantes(true);
        } catch (error) {
            console.error(error);
            alert("Error obteniendo usuarios faltantes");
        }
    };

    const copiarRecordatorio = async () => {
        if (!partidoFaltantes) return;

        const mensaje = `Buenas compañeros, les recuerdo que falta poner su predicción para el partido:

${partidoFaltantes.local} vs ${partidoFaltantes.visitante}

Faltan:
${usuariosFaltantes
                .map((usuario) => `- ${usuario.nombre || usuario.email || usuario.id}`)
                .join("\n")}

Por favor ingresar a la app y guardar su pronóstico antes de que inicie el partido.`;

        await navigator.clipboard.writeText(mensaje);
        alert("Recordatorio copiado");
    };

    if (cargandoAuth || cargando) {
        return <AdminPartidosSkeleton />;
    }

    if (perfil?.rol !== "admin") {
        return (
            <div className="min-h-screen bg-slate-100 p-6">
                <div className="mx-auto max-w-5xl rounded-2xl bg-white p-6 shadow-sm">
                    <h1 className="text-2xl font-bold text-red-600">
                        No tienes permisos para acceder
                    </h1>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 p-4 md:p-6">
            <div className="mx-auto max-w-6xl">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-3xl font-bold text-slate-900">
                        Administrar partidos
                    </h1>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <input
                            type="date"
                            value={fechaReporte}
                            onChange={(e) => setFechaReporte(e.target.value)}
                            className="rounded-xl border border-slate-300 bg-white px-4 py-3"
                        />

                        <button
                            onClick={generarReportePDF}
                            disabled={generandoReporte}
                            className="flex items-center justify-center gap-2 rounded-xl bg-slate-800 px-6 py-3 font-bold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-500"
                        >
                            {generandoReporte && (
                                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                            )}

                            {generandoReporte ? "Generando..." : "Reporte"}
                        </button>

                        <button
                            onClick={() => setMostrarFormulario(!mostrarFormulario)}
                            className="rounded-xl bg-blue-600 px-6 py-3 font-bold text-white transition hover:bg-blue-700"
                        >
                            + Agregar partido
                        </button>
                    </div>
                </div>

                {mostrarFormulario && (
                    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="mb-4 text-xl font-bold text-slate-900">
                            Nuevo partido
                        </h2>

                        <div className="grid gap-4 md:grid-cols-2">
                            <input
                                value={local}
                                onChange={(e) => setLocal(e.target.value)}
                                placeholder="Equipo local"
                                className="rounded-xl border border-slate-300 px-4 py-3"
                            />

                            <input
                                value={visitante}
                                onChange={(e) => setVisitante(e.target.value)}
                                placeholder="Equipo visitante"
                                className="rounded-xl border border-slate-300 px-4 py-3"
                            />

                            <input
                                type="date"
                                value={fechaPartido}
                                onChange={(e) => setFechaPartido(e.target.value)}
                                className="rounded-xl border border-slate-300 px-4 py-3"
                            />

                            <input
                                type="time"
                                value={horaPartido}
                                onChange={(e) => setHoraPartido(e.target.value)}
                                className="rounded-xl border border-slate-300 px-4 py-3"
                            />
                        </div>

                        <button
                            onClick={agregarPartido}
                            disabled={agregandoPartido}
                            className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
                        >
                            {agregandoPartido && (
                                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                            )}

                            {agregandoPartido ? "Guardando partido..." : "Guardar partido"}
                        </button>
                    </div>
                )}

                {partidos.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-600 shadow-sm">
                        No hay partidos registrados.
                    </div>
                ) : (
                    <div className="space-y-5">
                        {partidos.map((partido, index) => (
                            <PartidoAdminCard
                                key={partido.id}
                                partido={partido}
                                numero={index + 1}
                                onGuardar={guardarResultado}
                                onVerFaltantes={verFaltantes}
                                guardando={partidoGuardandoId === partido.id}
                            />
                        ))}
                    </div>
                )}

                {mostrarFaltantes && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                            <h2 className="text-xl font-bold text-slate-900">
                                Usuarios pendientes
                            </h2>

                            <p className="mt-2 text-slate-600">
                                {partidoFaltantes?.local} vs {partidoFaltantes?.visitante}
                            </p>

                            <div className="mt-4 space-y-2">
                                {usuariosFaltantes.length === 0 ? (
                                    <p className="rounded-xl bg-green-50 p-3 font-semibold text-green-700">
                                        Todos ya enviaron su predicción ✅
                                    </p>
                                ) : (
                                    usuariosFaltantes.map((usuario) => (
                                        <div
                                            key={usuario.id}
                                            className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-700"
                                        >
                                            {usuario.nombre || usuario.email || usuario.id}
                                        </div>
                                    ))
                                )}
                            </div>

                            {usuariosFaltantes.length > 0 && (
                                <button
                                    onClick={copiarRecordatorio}
                                    className="mt-5 w-full rounded-xl bg-orange-500 py-3 font-bold text-white transition hover:bg-orange-600"
                                >
                                    Copiar recordatorio
                                </button>
                            )}

                            <button
                                onClick={() => setMostrarFaltantes(false)}
                                className="mt-3 w-full rounded-xl bg-slate-800 py-3 font-bold text-white transition hover:bg-slate-900"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function PartidoAdminCard({
    partido,
    numero,
    onGuardar,
    onVerFaltantes,
    guardando,
}: {
    partido: any;
    numero: number;
    onGuardar: (
        partidoId: string,
        resultadoLocal: string,
        resultadoVisitante: string
    ) => void;
    onVerFaltantes: (partido: any) => void;
    guardando: boolean;
}) {
    const [resultadoLocal, setResultadoLocal] = useState(
        partido.resultadoLocal !== null && partido.resultadoLocal !== undefined
            ? String(partido.resultadoLocal)
            : ""
    );

    const [resultadoVisitante, setResultadoVisitante] = useState(
        partido.resultadoVisitante !== null && partido.resultadoVisitante !== undefined
            ? String(partido.resultadoVisitante)
            : ""
    );

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <p className="font-bold text-blue-600">Partido #{numero}</p>

                    <p className="text-slate-600">
                        Estado:{" "}
                        <span className="font-semibold text-slate-900">
                            {partido.estado}
                        </span>
                    </p>

                    <h2 className="mt-2 text-2xl font-bold text-slate-900">
                        {partido.local} vs {partido.visitante}
                    </h2>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3">
                        <input
                            type="number"
                            min="0"
                            value={resultadoLocal}
                            disabled={guardando}
                            onChange={(e) => setResultadoLocal(e.target.value)}
                            className="w-24 rounded-xl border border-slate-300 px-4 py-3 text-center disabled:cursor-not-allowed disabled:bg-slate-100"
                        />

                        <span className="font-bold">-</span>

                        <input
                            type="number"
                            min="0"
                            value={resultadoVisitante}
                            disabled={guardando}
                            onChange={(e) => setResultadoVisitante(e.target.value)}
                            className="w-24 rounded-xl border border-slate-300 px-4 py-3 text-center disabled:cursor-not-allowed disabled:bg-slate-100"
                        />
                    </div>

                    <button
                        onClick={() => onGuardar(partido.id, resultadoLocal, resultadoVisitante)}
                        disabled={guardando}
                        className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
                    >
                        {guardando && (
                            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        )}

                        {guardando ? "Calculando..." : "Guardar"}
                    </button>

                    <button
                        onClick={() => onVerFaltantes(partido)}
                        className="rounded-xl bg-orange-500 px-6 py-3 font-bold text-white transition hover:bg-orange-600"
                    >
                        Ver faltantes
                    </button>
                </div>
            </div>
        </div>
    );
}