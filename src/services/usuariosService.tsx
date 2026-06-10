import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import type { Usuario } from "../types/Usuario";

export async function obtenerUsuario(uid: string): Promise<Usuario | null> {
  const ref = doc(db, "usuarios", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  const data = snap.data() as Omit<Usuario, "id">;

  return {
    id: snap.id,
    ...data,
  };

}