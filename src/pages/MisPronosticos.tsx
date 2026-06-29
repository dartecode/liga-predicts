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

        return fechaPartido > ahora;
      });

      const partidosOrdenados = partidosFiltrados.sort((a, b) => {
        const aPronosticado = !!a.pronostico;
        const bPronosticado = !!b.pronostico;

        if (aPronosticado !== bPronosticado) {
          return aPronosticado ? 1 : -1;
        }

        return (
          convertirFecha(a.fechaPartido).getTime() -
          convertirFecha(b.fechaPartido).getTime()
        );
      });

      setPartidos(partidosOrdenados);

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

  const MisPronosticosSkeleton = () => {
    return (
      <div className="space-y-5 animate-pulse">
        {[1, 2].map((grupo) => (
          <div key={grupo} className="space-y-3">
            <div className="rounded-xl bg-slate-200 px-4 py-2">
              <div className="h-5 w-56 rounded bg-slate-300" />
            </div>

            {[1, 2].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-3">
                    <div className="h-4 w-20 rounded bg-slate-200" />

                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-slate-200" />
                      <div className="h-6 w-28 rounded bg-slate-200" />
                      <div className="h-5 w-8 rounded bg-slate-200" />
                      <div className="h-7 w-7 rounded-full bg-slate-200" />
                      <div className="h-6 w-28 rounded bg-slate-200" />
                    </div>

                    <div className="h-4 w-48 rounded bg-slate-200" />
                    <div className="h-4 w-40 rounded bg-slate-200" />
                  </div>

                  <div className="h-10 w-32 rounded-xl bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6">
      <div className="mx-auto max-w-4xl space-y-5">
        <h1 className="text-3xl font-black text-slate-800">
          Mis Pronósticos
        </h1>

        {cargando ? (
          <MisPronosticosSkeleton />
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

                        <h2 className="mt-1 flex flex-wrap items-center gap-2 text-xl font-bold text-slate-800">
                          <ReactCountryFlag
                            countryCode={BANDERAS[partido.local]}
                            svg
                            style={{ width: "1.5em", height: "1.5em" }}
                          />

                          {partido.local}

                          <span className="text-slate-400">vs</span>

                          {partido.visitante}

                          <ReactCountryFlag
                            countryCode={BANDERAS[partido.visitante]}
                            svg
                            style={{ width: "1.5em", height: "1.5em" }}
                          />

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
                        className={`rounded-xl px-5 py-2 font-bold transition ${bloqueado
                          ? "cursor-not-allowed bg-slate-200 text-slate-500"
                          : "bg-[#3483fa] text-white hover:bg-[#2968c8]"
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
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-3 sm:items-center">
          <div className="w-full max-w-md animate-[slideUp_0.25s_ease-out] rounded-t-3xl border border-slate-200 bg-white p-6 shadow-xl sm:rounded-2xl">
            <div className="border-b border-slate-200 bg-white px-5 py-4">
              <div className="flex items-center justify-between">
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
                  className="flex h-9 w-9 items-center justify-center rounded-full text-lg font-bold text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="bg-slate-100 p-5">
              <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                <p className="text-sm font-semibold text-blue-700">Partido</p>

                <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  <p className="font-black text-slate-800">
                    {partidoSeleccionado.local}
                  </p>

                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                    VS
                  </span>

                  <p className="font-black text-slate-800">
                    {partidoSeleccionado.visitante}
                  </p>
                </div>
              </div>

              <PrediccionForm
                partidoId={String(partidoSeleccionado.id)}
                usuario={perfil}
                onGuardado={(pronosticoActualizado) => {
                  setPartidos((prev) =>
                    prev.map((partido) =>
                      String(partido.id) === String(pronosticoActualizado.partidoId)
                        ? {
                          ...partido,
                          pronostico: pronosticoActualizado,
                        }
                        : partido
                    )
                  );

                  setPartidoSeleccionado(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}