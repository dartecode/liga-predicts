import type { Timestamp } from "firebase/firestore";

export interface Partido {
  id: string;
  torneoId: string;
  local: string;
  visitante: string;
  fechaPartido: Timestamp;
  estado: "pendiente" | "finalizado";
  resultadoLocal: number | null;
  resultadoVisitante: number | null;
}