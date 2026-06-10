import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "../firebase/config";
import { obtenerUsuario } from "../services/usuariosService";
import type { Usuario } from "../types/Usuario";

type AuthContextType = {
  user: User | null;
  perfil: Usuario | null;
  cargando: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  perfil: null,
  cargando: true,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  const logout = async () => {
    await signOut(auth);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (usuario) => {
      setCargando(true);

      if (usuario) {
        setUser(usuario);

        const perfilUsuario = await obtenerUsuario(usuario.uid);
        setPerfil(perfilUsuario);
      } else {
        setUser(null);
        setPerfil(null);
      }

      setCargando(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, perfil, cargando, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);