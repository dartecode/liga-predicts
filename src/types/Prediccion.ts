export interface Prediccion {
    partidoId: string;
    usuarioId: string;
    nombreUsuario: string;

    golesLocal: number;
    golesVisitante: number;

    fechaPrediccion: Date;
    fechaActualizacion: Date;

    puntos: number;
    resultadoExacto: boolean;
    partidoAcertado: boolean;
}