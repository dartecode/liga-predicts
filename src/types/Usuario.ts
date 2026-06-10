export interface Usuario {
    id: string;
    usuario: string;
    email: string;
    rol: "admin" | "usuario";
    activo: boolean;
}