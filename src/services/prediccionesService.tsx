import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import type { Prediccion } from "../types/Prediccion";

export async function guardarPrediccion(prediccion: Prediccion) {
    const prediccionId = `${prediccion.partidoId}_${prediccion.usuarioId}`;
    const ref = doc(db, "predicciones", prediccionId);

    const snap = await getDoc(ref);

    await setDoc(ref, {
        ...prediccion,
        fechaPrediccion: snap.exists()
            ? snap.data().fechaPrediccion
            : serverTimestamp(),
        fechaActualizacion: serverTimestamp(),
    });
}

export async function obtenerPrediccionUsuario(
    partidoId: string,
    usuarioId: string
): Promise<(Prediccion & { id: string }) | null> {

    const prediccionId = `${partidoId}_${usuarioId}`;

    const ref = doc(db, "predicciones", prediccionId);
    const snap = await getDoc(ref);

    if (!snap.exists()) return null;

    return {
        id: snap.id,
        ...(snap.data() as Prediccion),
    };
}