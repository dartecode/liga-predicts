import { useEffect, useState } from "react";
import {
    collection,
    getDocs,
    doc,
    updateDoc,
    addDoc,
    query,
    orderBy,
    Timestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

            await addDoc(collection(db, "partidos"), {
                local,
                visitante,
                fechaPartido: Timestamp.fromDate(fechaCompleta),
                estado: "pendiente",
                golesLocal: null,
                golesVisitante: null,
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
        golesLocal: string,
        golesVisitante: string
    ) => {
        if (golesLocal === "" || golesVisitante === "") {
            alert("Ingresa ambos resultados");
            return;
        }

        try {
            await updateDoc(doc(db, "partidos", partidoId), {
                golesLocal: Number(golesLocal),
                golesVisitante: Number(golesVisitante),
                estado: "finalizado",
            });

            await cargarPartidos();
        } catch (error) {
            console.error(error);
            alert("Error al guardar resultado");
        }
    };

    const generarReportePDF = async () => {
        if (!fechaReporte) {
            alert("Selecciona una fecha para generar el reporte");
            return;
        }

        try {
            const usuariosSnapshot = await getDocs(collection(db, "usuarios"));
            const prediccionesSnapshot = await getDocs(collection(db, "predicciones"));

            const usuarios = usuariosSnapshot.docs.map((documento) => ({
                id: documento.id,
                ...documento.data(),
            })) as any[];

            const predicciones = prediccionesSnapshot.docs.map((documento) => ({
                id: documento.id,
                ...documento.data(),
            })) as any[];

            const partidosFinalizados = partidos.filter((partido) => {
                const fecha = partido.fechaPartido?.toDate?.();

                if (!fecha) return false;

                const fechaTexto = fecha.toISOString().slice(0, 10);

                return (
                    partido.estado === "finalizado" &&
                    fechaTexto === fechaReporte
                );
            });

            if (partidosFinalizados.length === 0) {
                alert("No hay partidos finalizados para esa fecha");
                return;
            }

            const filas = usuarios.map((usuario) => {
                let puntos = 0;
                let prediccionesRealizadas = 0;

                partidosFinalizados.forEach((partido) => {
                    const prediccion = predicciones.find(
                        (p) => p.usuarioId === usuario.id && p.partidoId === partido.id
                    );

                    if (!prediccion) return;

                    prediccionesRealizadas++;

                    let puntosPartido = 0;

                    const acertoMarcadorExacto =
                        prediccion.golesLocal === partido.golesLocal &&
                        prediccion.golesVisitante === partido.golesVisitante;

                    const acertoResultado =
                        (prediccion.golesLocal > prediccion.golesVisitante &&
                            partido.golesLocal > partido.golesVisitante) ||
                        (prediccion.golesLocal < prediccion.golesVisitante &&
                            partido.golesLocal < partido.golesVisitante) ||
                        (prediccion.golesLocal === prediccion.golesVisitante &&
                            partido.golesLocal === partido.golesVisitante);

                    if (acertoMarcadorExacto) {
                        puntosPartido = 3;
                    } else if (acertoResultado) {
                        puntosPartido = 1;
                    }

                    puntos += puntosPartido;

                });

                return [
                    usuario.nombre || usuario.email || "Usuario",
                    prediccionesRealizadas,
                    puntos,
                ];
            });

            const docPDF = new jsPDF();

            const logo = "/logo-d3.png";

            docPDF.addImage(logo, "PNG", 14, 10, 24, 24);

            docPDF.setFontSize(18);
            docPDF.text("D3 Predicts", 44, 18);

            docPDF.setFontSize(12);
            docPDF.text("Reporte de Pronósticos", 44, 26);

            docPDF.setFontSize(10);
            docPDF.text(`Fecha del reporte: ${fechaReporte}`, 44, 33);
            docPDF.text(`Generado: ${new Date().toLocaleString()}`, 44, 39);

            autoTable(docPDF, {
                startY: 48,
                head: [["Usuario", "Pronósticos", "Puntos"]],
                body: filas,
            });

            docPDF.save(`reporte-pronosticos-${fechaReporte}.pdf`);


        } catch (error) {
            console.error(error);
            alert("Error al generar el reporte PDF");
        }
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

                <div className="flex gap-3">
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
                    />
                ))}
            </div>
        </div>
    );
}

function PartidoAdminCard({
    partido,
    numero,
    onGuardar,
}: {
    partido: any;
    numero: number;
    onGuardar: (
        partidoId: string,
        golesLocal: string,
        golesVisitante: string
    ) => void;
}) {
    const [golesLocal, setGolesLocal] = useState(
        partido.golesLocal !== null && partido.golesLocal !== undefined
            ? String(partido.golesLocal)
            : ""
    );

    const [golesVisitante, setGolesVisitante] = useState(
        partido.golesVisitante !== null && partido.golesVisitante !== undefined
            ? String(partido.golesVisitante)
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

                <div className="flex items-center gap-3">
                    <input
                        type="number"
                        min="0"
                        value={golesLocal}
                        onChange={(e) => setGolesLocal(e.target.value)}
                        className="w-24 rounded-xl border border-slate-300 px-4 py-3 text-center"
                    />

                    <span className="font-bold">-</span>

                    <input
                        type="number"
                        min="0"
                        value={golesVisitante}
                        onChange={(e) => setGolesVisitante(e.target.value)}
                        className="w-24 rounded-xl border border-slate-300 px-4 py-3 text-center"
                    />

                    <button
                        onClick={() =>
                            onGuardar(partido.id, golesLocal, golesVisitante)
                        }
                        className="rounded-xl bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700"
                    >
                        Guardar
                    </button>
                </div>
            </div>
        </div>
    );
}