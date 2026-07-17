import EmpresaCard from "../components/configuration/EmpresaCard";

export default function Configuracion() {
    return (
        <div className="space-y-6">
            <EmpresaCard />
            <div>
                <h1 className="text-3xl font-bold">
                    Configuración
                </h1>

                <p className="text-gray-500">
                    Configuración general del sistema.
                </p>
            </div>

            <div className="bg-white rounded-xl shadow border p-6">
                <h2 className="text-xl font-semibold mb-2">
                    Bienvenido
                </h2>

                <p>
                    Desde aquí podrás administrar la empresa, suscripciones,
                    seguridad y preferencias del sistema.
                </p>
            </div>

        </div>
    );
}