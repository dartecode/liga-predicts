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

    const cargarPartidos = async () => {
        try {
            setCargando(true);

            const q = query(
                collection(db, "partidos"),
                orderBy("fechaPartido", "asc")
            );

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
        if (!local || !visitante || !fechaPartido || !horaPartido) {
            alert("Completa todos los campos");
            return;
        }

        try {
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
        }
    };

    const guardarResultado = async (
        partidoId: string,
        resultadoLocal: string,
        resultadoVisitante: string
    ) => {
        if (resultadoLocal === "" || resultadoVisitante === "") {
            alert("Ingresa ambos resultados");
            return;
        }

        try {
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
        }
    };

    const convertirFecha = (fecha: any) => {
        if (fecha?.toDate) {
            return fecha.toDate();
        }

        return new Date(fecha);
    };

    const generarReportePDF = async () => {
        if (!fechaReporte) {
            alert("Selecciona una fecha para generar el reporte");
            return;
        }

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

        const doc = new jsPDF();

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

        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text("D3 Predicts", 20, y);

        y += 10;
        doc.setFontSize(13);
        doc.setFont("helvetica", "normal");
        doc.text("Reporte de Pronósticos", 20, y);

        y += 8;
        doc.setFontSize(10);
        doc.text(`Fecha del reporte: ${fechaReporte}`, 20, y);
        doc.text(`Generado: ${new Date().toLocaleString()}`, 20, y + 6);

        y += 20;

        for (const partido of partidosDelDia) {
            const prediccionesSnap = await getDocs(
                query(
                    collection(db, "predicciones"),
                    where("partidoId", "==", partido.id)
                )
            );

            const predicciones = prediccionesSnap.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as any[];

            if (y > 245) {
                doc.addPage();
                y = 20;
            }

            const golesLocal = partido.resultadoLocal ?? "-";
            const golesVisitante = partido.resultadoVisitante ?? "-";

            doc.setFillColor(41, 128, 185);
            doc.rect(20, y, 170, 8, "F");

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.text(`${partido.local} vs ${partido.visitante}`, 23, y + 5.5);

            y += 14;

            doc.setTextColor(0, 0, 0);
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.text("Resultado oficial:", 20, y);

            y += 8;

            doc.setFont("helvetica", "normal");
            doc.text(
                `${partido.local} ${golesLocal} - ${golesVisitante} ${partido.visitante}`,
                25,
                y
            );

            y += 12;

            doc.setFillColor(41, 128, 185);
            doc.rect(20, y, 170, 8, "F");

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text("Usuario", 23, y + 5.5);
            doc.text("Pronóstico", 85, y + 5.5);
            doc.text("Puntos", 165, y + 5.5);

            y += 8;

            doc.setTextColor(0, 0, 0);
            doc.setFont("helvetica", "normal");

            if (predicciones.length === 0) {
                doc.text("Sin predicciones registradas", 23, y + 6);
                y += 10;
            } else {
                predicciones.forEach((prediccion, index) => {
                    if (y > 275) {
                        doc.addPage();
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
                        doc.setFillColor(245, 245, 245);
                        doc.rect(20, y, 170, 8, "F");
                    }

                    doc.setFontSize(9);
                    doc.text(String(usuario), 23, y + 5.5);
                    doc.text(
                        `${partido.local} ${predLocal} - ${predVisitante} ${partido.visitante}`,
                        85,
                        y + 5.5
                    );
                    doc.text(String(puntos), 167, y + 5.5);

                    y += 8;
                });
            }

            y += 14;
        }

        doc.save(`reporte-pronosticos-${fechaReporte}.pdf`);
    };

    const verFaltantes = async (partido: any) => {
        try {
            const usuariosSnapshot = await getDocs(collection(db, "usuarios"));

            const usuarios = usuariosSnapshot.docs.map((documento) => ({
                id: documento.id,
                ...documento.data(),
            })) as any[];

            const prediccionesSnapshot = await getDocs(
                query(
                    collection(db, "predicciones"),
                    where("partidoId", "==", partido.id)
                )
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
        return <p className="p-6">Cargando...</p>;
    }

    if (perfil?.rol !== "admin") {
        return (
            <div className="p-6">
                <h1 className="text-2xl font-bold text-red-600">
                    No tienes permisos para acceder
                </h1>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-3xl font-bold text-slate-900">
                    Administrar partidos
                </h1>

                <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                        type="date"
                        value={fechaReporte}
                        onChange={(e) => setFechaReporte(e.target.value)}
                        className="rounded-xl border border-slate-300 px-4 py-3"
                    />

                    <button
                        onClick={generarReportePDF}
                        className="rounded-xl bg-slate-800 px-6 py-3 font-bold text-white hover:bg-slate-900"
                    >
                        Reporte
                    </button>

                    <button
                        onClick={() => setMostrarFormulario(!mostrarFormulario)}
                        className="rounded-xl bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700"
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
                        className="mt-5 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700"
                    >
                        Guardar partido
                    </button>
                </div>
            )}

            <div className="space-y-5">
                {partidos.map((partido, index) => (
                    <PartidoAdminCard
                        key={partido.id}
                        partido={partido}
                        numero={index + 1}
                        onGuardar={guardarResultado}
                        onVerFaltantes={verFaltantes}
                    />
                ))}
            </div>

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
                                className="mt-5 w-full rounded-xl bg-orange-500 py-3 font-bold text-white hover:bg-orange-600"
                            >
                                Copiar recordatorio
                            </button>
                        )}

                        <button
                            onClick={() => setMostrarFaltantes(false)}
                            className="mt-3 w-full rounded-xl bg-slate-800 py-3 font-bold text-white hover:bg-slate-900"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function PartidoAdminCard({
    partido,
    numero,
    onGuardar,
    onVerFaltantes,
}: {
    partido: any;
    numero: number;
    onGuardar: (
        partidoId: string,
        resultadoLocal: string,
        resultadoVisitante: string
    ) => void;
    onVerFaltantes: (partido: any) => void;
}) {
    const [resultadoLocal, setResultadoLocal] = useState(
        partido.resultadoLocal !== null && partido.resultadoLocal !== undefined
            ? String(partido.resultadoLocal)
            : ""
    );

    const [resultadoVisitante, setResultadoVisitante] = useState(
        partido.resultadoVisitante !== null &&
            partido.resultadoVisitante !== undefined
            ? String(partido.resultadoVisitante)
            : ""
    );

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
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
                            onChange={(e) => setResultadoLocal(e.target.value)}
                            className="w-24 rounded-xl border border-slate-300 px-4 py-3 text-center"
                        />

                        <span className="font-bold">-</span>

                        <input
                            type="number"
                            min="0"
                            value={resultadoVisitante}
                            onChange={(e) => setResultadoVisitante(e.target.value)}
                            className="w-24 rounded-xl border border-slate-300 px-4 py-3 text-center"
                        />
                    </div>

                    <button
                        onClick={() =>
                            onGuardar(partido.id, resultadoLocal, resultadoVisitante)
                        }
                        className="rounded-xl bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700"
                    >
                        Guardar
                    </button>

                    <button
                        onClick={() => onVerFaltantes(partido)}
                        className="rounded-xl bg-orange-500 px-6 py-3 font-bold text-white hover:bg-orange-600"
                    >
                        Ver faltantes
                    </button>
                </div>
            </div>
        </div>
    );
}