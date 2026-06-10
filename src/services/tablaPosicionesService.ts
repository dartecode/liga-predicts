import {
    collection,
    doc,
    getDocs,
    query,
    where,
    updateDoc,
    setDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { getDoc } from "firebase/firestore";

function obtenerResultado(local: number, visitante: number) {
    if (local > visitante) return "LOCAL";
    if (local < visitante) return "VISITANTE";
    return "EMPATE";
}

function calcularPuntos(
    golesLocal: number,
    golesVisitante: number,
    resultadoLocal: number,
    resultadoVisitante: number
) {
    const resultadoExacto =
        golesLocal === resultadoLocal && golesVisitante === resultadoVisitante;

    const partidoAcertado =
        obtenerResultado(golesLocal, golesVisitante) ===
        obtenerResultado(resultadoLocal, resultadoVisitante);

    const puntos = resultadoExacto ? 3 : partidoAcertado ? 1 : 0;

    return {
        puntos,
        resultadoExacto,
        partidoAcertado,
    };
}

export async function calcularPuntosPorPartido(partidoId: string) {
    const partidoSnap = await getDoc(doc(db, "partidos", partidoId));

    if (!partidoSnap.exists()) {
        throw new Error("El partido no existe");
    }

    const partido = partidoSnap.data();

    if (
        partido.resultadoLocal === null ||
        partido.resultadoVisitante === null
    ) {
        throw new Error("El partido todavía no tiene resultado");
    }

    const prediccionesRef = collection(db, "predicciones");

    const q = query(prediccionesRef, where("partidoId", "==", partidoId));

    const snap = await getDocs(q);

    for (const documento of snap.docs) {
        const prediccion = documento.data();

        const calculo = calcularPuntos(
            prediccion.golesLocal,
            prediccion.golesVisitante,
            partido.resultadoLocal,
            partido.resultadoVisitante
        );

        await updateDoc(doc(db, "predicciones", documento.id), calculo);
    }

    await recalcularTablaPosiciones();
}

export async function recalcularTablaPosiciones() {
    const snap = await getDocs(collection(db, "predicciones"));

    const tabla: Record<string, any> = {};

    snap.forEach((documento) => {
        const prediccion = documento.data();

        if (prediccion.puntos === undefined) return;

        if (!tabla[prediccion.usuarioId]) {
            tabla[prediccion.usuarioId] = {
                usuarioId: prediccion.usuarioId,
                nombreUsuario: prediccion.nombreUsuario,
                puntos: 0,
                exactos: 0,
                acertados: 0,
                fallados: 0,
                pronosticos: 0,
            };
        }

        tabla[prediccion.usuarioId].puntos += prediccion.puntos;
        tabla[prediccion.usuarioId].exactos += prediccion.resultadoExacto ? 1 : 0;
        tabla[prediccion.usuarioId].acertados += prediccion.partidoAcertado ? 1 : 0;
        tabla[prediccion.usuarioId].fallados += prediccion.partidoAcertado ? 0 : 1;
        tabla[prediccion.usuarioId].pronosticos += 1;
    });

    for (const usuarioId in tabla) {
        await setDoc(doc(db, "tabla_posiciones", usuarioId), tabla[usuarioId]);
    }
}