import { useRegisterSW } from "virtual:pwa-register/react";

export default function PwaUpdatePrompt() {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegisterError(error) {
            console.error("Error registrando Service Worker:", error);
        },
    });

    const cerrar = () => {
        setOfflineReady(false);
        setNeedRefresh(false);
    };

    if (!offlineReady && !needRefresh) return null;

    return (
        <div className="fixed left-4 right-4 top-6 z-[9999] mx-auto max-w-md rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
            <p className="mb-3 text-sm font-medium text-gray-800">
                {needRefresh
                    ? "Hay una nueva actualización disponible."
                    : "La aplicación está lista para usarse sin conexión."}
            </p>

            <div className="flex gap-2">
                {needRefresh && (
                    <button
                        onClick={() => updateServiceWorker(true)}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                    >
                        Actualizar
                    </button>
                )}

                <button
                    onClick={cerrar}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
                >
                    Cerrar
                </button>
            </div>
        </div>
    );
}