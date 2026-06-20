import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Link } from "react-router-dom";
import { db } from "../firebase/config";
import { obtenerPartidos } from "../services/partidosService";
import { useAuth } from "../context/AuthContext";
import { BANDERAS } from "../utils/banderas";
import ReactCountryFlag from "react-country-flag";
import PrediccionForm from "../components/PrediccionForm";

export default function Home() {
  const { perfil } = useAuth();

  const [partidos, setPartidos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [partidoSeleccionado, setPartidoSeleccionado] = useState<any | null>(
    null
  );

  const convertirFecha = (fecha: any) =>
    fecha?.toDate ? fecha.toDate() : new Date(fecha);

  const partidoBloqueado = (fecha: any) => {
    return new Date() >= convertirFecha(fecha);
  };

  const esHoy = (fecha: any) => {
    const date = convertirFecha(fecha);
    const hoy = new Date();

    return (
      date.getDate() === hoy.getDate() &&
      date.getMonth() === hoy.getMonth() &&
      date.getFullYear() === hoy.getFullYear()
    );
  };

  const formatearHora = (fecha: any) => {
    return convertirFecha(fecha).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const cargarPartidos = async () => {
    try {
      setCargando(true);

      const data = await obtenerPartidos();

      if (!perfil?.id) {
        setPartidos(data);
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

      setPartidos(partidosConPronostico);
    } catch (error) {
      console.error(error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPartidos();
  }, [perfil?.id]);

  const partidosHoy = partidos
    .filter((partido) => esHoy(partido.fechaPartido))
    .sort(
      (a, b) =>
        convertirFecha(a.fechaPartido).getTime() -
        convertirFecha(b.fechaPartido).getTime()
    );

  const totalPartidos = partidos.length;

  const totalPronosticados = partidos.filter((p) => p.pronostico).length;

  const totalPendientes = totalPartidos - totalPronosticados;

  const ahora = new Date();

  const proximoPartido = [...partidos]
    .filter((partido) => convertirFecha(partido.fechaPartido) > ahora)
    .sort(
      (a, b) =>
        convertirFecha(a.fechaPartido).getTime() -
        convertirFecha(b.fechaPartido).getTime()
    )[0];

  const tiempoRestante = (fecha: any) => {
    const diferencia = convertirFecha(fecha).getTime() - new Date().getTime();

    if (diferencia <= 0) return "Cerrado";

    const horas = Math.floor(diferencia / (1000 * 60 * 60));
    const minutos = Math.floor(
      (diferencia % (1000 * 60 * 60)) / (1000 * 60)
    );

    return `${horas}h ${minutos}m`;
  };

  const HomeSkeleton = () => {
    return (
      <div className="space-y-5 animate-pulse">
        {[1, 2].map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-3">
                <div className="h-6 w-64 rounded bg-slate-200" />
                <div className="h-4 w-32 rounded bg-slate-200" />
                <div className="h-4 w-44 rounded bg-slate-200" />
              </div>

              <div className="h-10 w-32 rounded-xl bg-slate-200" />
            </div>
          </div>
        ))}

        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm"
            >
              <div className="mx-auto mb-2 h-7 w-10 rounded bg-slate-200" />
              <div className="mx-auto h-4 w-20 rounded bg-slate-200" />
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <div className="h-4 w-32 rounded bg-slate-200" />
              <div className="h-6 w-56 rounded bg-slate-200" />
              <div className="h-4 w-24 rounded bg-slate-200" />
            </div>

            <div className="space-y-2">
              <div className="h-3 w-16 rounded bg-slate-200" />
              <div className="h-7 w-20 rounded bg-slate-200" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6">
      <div className="mx-auto max-w-4xl space-y-5">
        <div>
          <p className="text-sm font-semibold text-blue-700">Inicio</p>
          <h1 className="text-3xl font-black text-slate-800">
            Partidos de hoy
          </h1>
        </div>

        {cargando ? (
          <HomeSkeleton />
        ) : (
          <>
            {partidosHoy.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                <p className="text-lg font-bold text-slate-800">
                  No hay partidos programados para hoy
                </p>

                <Link
                  to="/mis-pronosticos"
                  className="mt-4 inline-block rounded-xl bg-slate-800 px-5 py-2 font-bold text-white"
                >
                  Ver todos los partidos
                </Link>
              </div>
            ) : (
              partidosHoy.map((partido) => {
                const bloqueado = partidoBloqueado(partido.fechaPartido);

                return (
                  <div
                    key={partido.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h2 className="flex flex-wrap items-center gap-2 text-xl font-bold text-slate-800">
                          <ReactCountryFlag
                            countryCode={BANDERAS[partido.local]}
                            svg
                            style={{ width: "1.2em", height: "1.2em" }}
                          />

                          {partido.local}

                          <span className="text-slate-400">vs</span>

                          <ReactCountryFlag
                            countryCode={BANDERAS[partido.visitante]}
                            svg
                            style={{ width: "1.2em", height: "1.2em" }}
                          />

                          {partido.visitante}
                        </h2>

                        <p className="mt-2 text-sm text-slate-500">
                          🕒 {formatearHora(partido.fechaPartido)}
                        </p>

                        <p className="mt-2 text-sm font-semibold text-slate-700">
                          🎯 Mi pronóstico:{" "}
                          {partido.pronostico
                            ? `${partido.pronostico.golesLocal} - ${partido.pronostico.golesVisitante}`
                            : "Sin pronóstico"}
                        </p>
                      </div>

                      {bloqueado ? (
                        <span className="rounded-xl bg-slate-300 px-5 py-2 text-center font-bold text-slate-600">
                          Pronóstico cerrado
                        </span>
                      ) : (
                        <button
                          onClick={() => setPartidoSeleccionado(partido)}
                          className="rounded-xl bg-gradient-to-r from-red-600 to-green-600 px-5 py-2 text-center font-bold text-white shadow-md"
                        >
                          {partido.pronostico ? "Editar" : "Pronosticar"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                <p className="text-2xl font-black text-slate-800">
                  {totalPartidos}
                </p>
                <p className="text-sm text-slate-500">Partidos</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                <p className="text-2xl font-black text-green-600">
                  {totalPronosticados}
                </p>
                <p className="text-sm text-slate-500">Hechos</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                <p className="text-2xl font-black text-orange-500">
                  {totalPendientes}
                </p>
                <p className="text-sm text-slate-500">Pendientes</p>
              </div>
            </div>

            {proximoPartido && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-orange-600">
                      ⏳ Próximo cierre
                    </p>

                    <h3 className="mt-2 flex flex-wrap items-center gap-2 text-lg font-bold text-slate-800">
                      <ReactCountryFlag
                        countryCode={BANDERAS[proximoPartido.local]}
                        svg
                        style={{ width: "1.2em", height: "1.2em" }}
                      />

                      {proximoPartido.local}

                      <span className="text-slate-400">vs</span>

                      <ReactCountryFlag
                        countryCode={BANDERAS[proximoPartido.visitante]}
                        svg
                        style={{ width: "1.2em", height: "1.2em" }}
                      />

                      {proximoPartido.visitante}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      {formatearHora(proximoPartido.fechaPartido)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-slate-500">Cierra en</p>

                    <p className="text-2xl font-black text-red-600">
                      {tiempoRestante(proximoPartido.fechaPartido)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {partidoSeleccionado && perfil && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-800">
                Pronosticar partido
              </h2>

              <button
                onClick={() => setPartidoSeleccionado(null)}
                className="rounded-lg bg-slate-100 px-3 py-1 font-bold text-slate-600"
              >
                ✕
              </button>
            </div>

            <p className="mb-4 text-center font-bold text-slate-800">
              {partidoSeleccionado.local} vs {partidoSeleccionado.visitante}
            </p>

            <PrediccionForm
              partidoId={partidoSeleccionado.id}
              usuario={perfil}
              onGuardado={() => {
                setPartidoSeleccionado(null);
                cargarPartidos();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}