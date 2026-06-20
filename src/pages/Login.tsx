import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/config";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const ingresar = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error(error);
      alert("Usuario o contraseña incorrectos");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <form
        onSubmit={ingresar}
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg"
      >
        <div className="mb-6 flex flex-col items-center">
          <img
            src="/logo-d3.png"
            alt="D3 Predicts"
            className="h-32 w-32 rounded-2xl object-cover shadow-md"
          />

          <h1 className="mt-4 text-center text-3xl font-extrabold text-slate-800">
            D3 Predicts
          </h1>

          <p className="mt-1 text-center text-sm font-medium text-slate-500">
            FIFA World Cup 2026
          </p>
        </div>

        <p className="mb-8 text-center text-slate-500">
          Ingresa a tu liga de predicciones
        </p>

        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Correo
          </label>

          <input
            type="email"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="correo@d3.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Contraseña
          </label>

          <input
            type="password"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700"
        >
          Ingresar
        </button>
      </form>
    </div>
  );
}