export default function EmpresaCard() {
    return (
        <div className="bg-white rounded-xl shadow border p-6">

            <h2 className="text-xl font-semibold mb-2">
                Empresa
            </h2>

            <p className="text-gray-500 mb-6">
                Configuración de la empresa emisora.
            </p>

            <button
                className="
                    bg-blue-600
                    hover:bg-blue-700
                    text-white
                    px-5
                    py-2
                    rounded-lg
                "
            >
                Configurar empresa
            </button>

        </div>
    );
}