import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { obtenerPartidos } from "../services/partidosService";
import { useAuth } from "../context/AuthContext";
import PrediccionForm from "../components/PrediccionForm";
import { db } from "../firebase/config";
import ReactCountryFlag from "react-country-flag";
import { BANDERAS } from "../utils/banderas";

export default function MisPronosticos() {
  const { perfil } = useAuth();

  const [partidos, setPartidos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [partidoSeleccionado, setPartidoSeleccionado] = useState<any | null>(
    null
  );

  const convertirFecha = (fecha: any) => {
    return fecha?.toDate ? fecha.toDate() : new Date(fecha);
  };

  const cargarPartidos = async () => {
    try {
      setCargando(true);

      const data = (await obtenerPartidos()) as any[];
      const ahora = new Date();

      if (!perfil?.id) {
        const partidosFuturos = data.filter((partido) => {
          const fechaPartido = convertirFecha(partido.fechaPartido);
          return fechaPartido > ahora;
        });

        setPartidos(partidosFuturos);
        return;
      }

      const q = query(
        collection(db, "predicciones"),
        where("usuarioId", "==", perfil.id)
      );

      const snapshot = await getDocs(q);

      const predicciones = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const partidosConPronostico = data.map((partido) => {
        const pronostico = predicciones.find(
          (p: any) => String(p.partidoId) === String(partido.id)
        );

        return {
          ...partido,
          pronostico,
        };
      });

      const partidosFiltrados = partidosConPronostico.filter((partido) => {
        const fechaPartido = convertirFecha(partido.fechaPartido);

        return fechaPartido > ahora || partido.pronostico;
      });

      setPartidos(partidosFiltrados);
    } catch (error) {
      console.error(error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPartidos();
  }, [perfil?.id]);

  const partidoYaInicio = (fecha: any) => {
    const fechaPartido = convertirFecha(fecha);
    const ahora = new Date();

    return ahora >= fechaPartido;
  };

  const formatearFechaPartido = (fecha: any) => {
    const date = convertirFecha(fecha);

    return date.toLocaleString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const obtenerClaveFecha = (fecha: any) => {
    const date = convertirFecha(fecha);

    return date.toLocaleDateString(undefined, {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const partidosAgrupados = partidos.reduce<Record<string, any[]>>(
    (acc, partido) => {
      const fecha = obtenerClaveFecha(partido.fechaPartido);

      if (!acc[fecha]) {
        acc[fecha] = [];
      }

      acc[fecha].push(partido);

      return acc;
    },
    {}
  );

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6">
      <div className="mx-auto max-w-4xl space-y-5">
        <h1 className="text-3xl font-black text-slate-800">
          Mis Pronósticos
        </h1>

        {cargando ? (
          <p className="text-slate-700">Cargando partidos...</p>
        ) : Object.keys(partidosAgrupados).length === 0 ? (
          <p className="rounded-2xl bg-white p-5 text-slate-600 shadow-sm">
            No tienes partidos disponibles para pronosticar.
          </p>
        ) : (
          Object.entries(partidosAgrupados).map(([fecha, partidosDia]) => (
            <div key={fecha} className="space-y-3">
              <div className="sticky top-0 z-10 rounded-xl bg-slate-200 px-4 py-2">
                <h2 className="font-bold capitalize text-slate-700">
                  📅 {fecha}
                </h2>
              </div>

              {partidosDia.map((partido) => {
                const bloqueado = partidoYaInicio(partido.fechaPartido);

                return (
                  <div
                    key={partido.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-blue-700">
                          Partido
                        </p>

                        <h2 className="mt-1 flex items-center gap-2 text-xl font-bold text-slate-800">
                          <ReactCountryFlag
                            countryCode={BANDERAS[partido.local]}
                            svg
                            style={{ width: "1.5em", height: "1.5em" }}
                          />

                          {partido.local}

                          <span className="text-slate-400">vs</span>

                          <ReactCountryFlag
                            countryCode={BANDERAS[partido.visitante]}
                            svg
                            style={{ width: "1.5em", height: "1.5em" }}
                          />

                          {partido.visitante}
                        </h2>

                        <p className="mt-2 text-sm text-slate-500">
                          🕒 {formatearFechaPartido(partido.fechaPartido)}
                        </p>

                        {bloqueado && (
                          <p className="mt-2 text-sm font-semibold text-red-600">
                            🔒 Pronóstico cerrado
                          </p>
                        )}

                        <p className="mt-2 text-sm font-semibold text-slate-700">
                          🎯 Mi pronóstico:{" "}
                          {partido.pronostico
                            ? `${partido.pronostico.golesLocal} - ${partido.pronostico.golesVisitante}`
                            : "Sin pronóstico"}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          if (bloqueado) return;
                          setPartidoSeleccionado(partido);
                        }}
                        disabled={bloqueado}
                        className={`rounded-xl px-5 py-2 font-bold shadow-sm transition ${
                          bloqueado
                            ? "cursor-not-allowed bg-slate-300 text-slate-500"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        {bloqueado
                          ? "Pronóstico cerrado"
                          : partido.pronostico
                          ? "Editar"
                          : "Pronosticar"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {partidoSeleccionado && perfil && (
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
                onClick={() => setPartidoSeleccionado(null)}
                className="rounded-full px-3 py-1 text-lg font-bold text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
              <p className="text-sm text-slate-500">Partido</p>

              <h3 className="mt-2 text-lg font-black text-slate-800">
                {partidoSeleccionado.local} vs {partidoSeleccionado.visitante}
              </h3>
            </div>

            <PrediccionForm
              partidoId={String(partidoSeleccionado.id)}
              usuario={perfil}
              onGuardado={async () => {
                setPartidoSeleccionado(null);
                await cargarPartidos();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}