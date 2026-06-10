import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../firebase/config";

export async function obtenerPartidos() {
  const q = query(
    collection(db, "partidos"),
    orderBy("fechaPartido", "asc")
  );

  const snap = await getDocs(q);

  return snap.docs.map((documento) => ({
    id: documento.id,
    ...documento.data(),
  }));
}