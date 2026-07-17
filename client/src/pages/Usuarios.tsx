import { useEffect, useState } from "react";
import api from "../api/api";


interface Usuario {
    _id: string;
    name: string;
    email: string;
    role: string;
    plan: "trial" | "monthly";
    isActive: boolean;
    trialEndsAt?: string | null;
}

interface Empresa {
    _id: string;
    nombre: string;
}


export default function Usuarios() {
    useEffect(() => {
        cargarUsuarios();
        cargarResumen();
        cargarEmpresas();
    }, []);

    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [empresas, setEmpresas] = useState<Empresa[]>([]);
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        role: "publico",
        trialDays: 30,
        empresa: ""
    });
    const [summary, setSummary] = useState({
        total: 0,
        active: 0,
        expired: 0,
        suspended: 0
    });

    const cargarUsuarios = async () => {
        try {
            setLoading(true);

            const res = await api.get("/users");

            setUsuarios(res.data);
        } catch (err) {
            console.error(err);
            alert("Error cargando usuarios");
        } finally {
            setLoading(false);
        }
    };

    const cargarEmpresas = async () => {
        try {
            const res = await api.get("/empresas");
            setEmpresas(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const cargarResumen = async () => {
        try {
            const res = await api.get("/users/admin/summary");
            setSummary(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const crearUsuario = async (
        e: React.FormEvent
    ) => {
        e.preventDefault();

        try {
            await api.post("/users", form);

            alert("Usuario creado");

            setForm({
                name: "",
                email: "",
                password: "",
                role: "publico",
                trialDays: 30
            });

            cargarUsuarios();

        } catch (err: any) {

            console.error(err);

            alert(
                err?.response?.data?.error ||
                "Error creando usuario"
            );
        }
    };
    const getUserStatus = (user: Usuario) => {

        if (!user.isActive) {
            return {
                text: "Suspendido",
                className: "bg-red-100 text-red-700"
            };
        }

        if (user.plan === "monthly") {
            return {
                text: "Activo",
                className: "bg-green-100 text-green-700"
            };
        }

        if (
            user.trialEndsAt &&
            new Date(user.trialEndsAt) < new Date()
        ) {
            return {
                text: "Expirado",
                className: "bg-gray-200 text-gray-700"
            };
        }

        return {
            text: "En prueba",
            className: "bg-yellow-100 text-yellow-700"
        };

    };

    const eliminarUsuario = async (
        id: string
    ) => {

        const confirmar = window.confirm(
            "¿Eliminar usuario?"
        );

        if (!confirmar) return;

        try {

            await api.delete(`/users/${id}`);

            cargarUsuarios();

        } catch (err) {

            console.error(err);

            alert(
                "Error eliminando usuario"
            );
        }
    };

    const extenderTrial = async (
        id: string,
        days: number
    ) => {

        try {

            await api.patch(
                `/users/${id}/extend-trial`,
                { days }
            );

            alert(`Trial extendido ${days} días`);

            cargarUsuarios();
            cargarResumen();

        } catch (err: any) {

            console.error(err);

            alert(
                err?.response?.data?.error ||
                "Error extendiendo trial"
            );
        }

    };
    return (
        <div className="p-6 flex flex-col gap-6">

            <div>
                <h1 className="text-3xl font-bold">
                    Usuarios
                </h1>

                <p className="text-gray-500">
                    Administración de usuarios
                </p>
            </div>
            <div className="grid grid-cols-4 gap-4 mb-6">

                <div className="p-4 bg-white shadow rounded-xl">
                    <p>Total</p>
                    <h2 className="text-2xl font-bold">{summary.total}</h2>
                </div>

                <div className="p-4 bg-green-50 shadow rounded-xl">
                    <p>Activos</p>
                    <h2 className="text-2xl font-bold">{summary.active}</h2>
                </div>

                <div className="p-4 bg-red-50 shadow rounded-xl">
                    <p>Expirados</p>
                    <h2 className="text-2xl font-bold">{summary.expired}</h2>
                </div>

                <div className="p-4 bg-yellow-50 shadow rounded-xl">
                    <p>Suspendidos</p>
                    <h2 className="text-2xl font-bold">{summary.suspended}</h2>
                </div>

            </div>
            {/* FORMULARIO */}

            <div className="bg-white rounded-xl shadow border p-5">

                <h2 className="font-semibold text-lg mb-4">
                    Nuevo Usuario
                </h2>

                <form
                    onSubmit={crearUsuario}
                    className="grid md:grid-cols-4 gap-4"
                >

                    <input
                        placeholder="Nombre"
                        value={form.name}
                        onChange={(e) =>
                            setForm({
                                ...form,
                                name: e.target.value
                            })
                        }
                        className="border rounded-lg px-3 py-2"
                        required
                    />

                    <input
                        placeholder="Email"
                        type="email"
                        value={form.email}
                        onChange={(e) =>
                            setForm({
                                ...form,
                                email: e.target.value
                            })
                        }
                        className="border rounded-lg px-3 py-2"
                        required
                    />

                    <input
                        placeholder="Password"
                        type="password"
                        value={form.password}
                        onChange={(e) =>
                            setForm({
                                ...form,
                                password: e.target.value
                            })
                        }
                        className="border rounded-lg px-3 py-2"
                        required
                    />

                    <select
                        value={form.role}
                        onChange={(e) =>
                            setForm({
                                ...form,
                                role: e.target.value
                            })
                        }
                        className="border rounded-lg px-3 py-2"
                    >
                        <option value="publico">Público</option>
                        <option value="vendedor">Vendedor</option>
                        <option value="contador">Contador</option>
                        <option value="admin">Administrador</option>
                    </select>

                    <input
                        type="number"
                        min="0"
                        max="365"
                        value={form.trialDays}
                        onChange={(e) =>
                            setForm({
                                ...form,
                                trialDays: Number(e.target.value)
                            })
                        }
                        placeholder="Días de prueba"
                        className="border rounded-lg px-3 py-2"
                    />

                    <select
                        value={form.empresa}
                        onChange={(e) =>
                            setForm({
                                ...form,
                                empresa: e.target.value
                            })
                        }
                        className="border rounded-lg px-3 py-2"
                        required
                    >
                        <option value="">
                            Seleccione empresa
                        </option>

                        {empresas.map((empresa) => (
                            <option
                                key={empresa._id}
                                value={empresa._id}
                            >
                                {empresa.nombre}
                            </option>
                        ))}
                    </select>

                    <button
                        type="submit"
                        className="bg-blue-600 text-white rounded-lg px-4 py-2"
                    >
                        Crear Usuario
                    </button>

                </form>

            </div>

            {/* TABLA */}

            <div className="bg-white rounded-xl shadow border overflow-hidden">

                <table className="w-full">

                    <thead className="bg-gray-100">

                        <tr>

                            <th className="text-left p-4">
                                Nombre
                            </th>

                            <th className="text-left p-4">
                                Email
                            </th>
                            <th className="text-left p-4">
                                Rol
                            </th>
                            <th className="text-left p-4">
                                Plan
                            </th>
                            <th className="text-left p-4">
                                Estado
                            </th>
                            <th className="text-left p-4">
                                Trial
                            </th>
                            <th className="text-left p-4">
                                Acciónes
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        {loading && (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="p-4"
                                >
                                    Cargando...
                                </td>
                            </tr>
                        )}

                        {!loading &&
                            usuarios.map((u) => (

                                <tr
                                    key={u._id}
                                    className="border-t"
                                >
                                    <td className="p-4">

                                        <span
                                            className={`px-2 py-1 rounded text-sm ${u.plan === "monthly"
                                                ? "bg-green-100 text-green-700"
                                                : "bg-yellow-100 text-yellow-700"
                                                }`}
                                        >
                                            {u.plan === "monthly"
                                                ? "Mensual"
                                                : "Trial"}
                                        </span>

                                    </td>
                                    <td className="p-4">

                                        {(() => {

                                            const status = getUserStatus(u);

                                            return (
                                                <span
                                                    className={`px-2 py-1 rounded text-sm ${status.className}`}
                                                >
                                                    {status.text}
                                                </span>
                                            );

                                        })()}

                                    </td>
                                    <td className="p-4">
                                        {u.name}
                                    </td>

                                    <td className="p-4">
                                        {u.email}
                                    </td>

                                    <td className="p-4">
                                        {u.trialEndsAt
                                            ? new Date(u.trialEndsAt).toLocaleDateString()
                                            : "Sin fecha"}
                                    </td>

                                    <td className="p-4">
                                        <span className="px-2 py-1 rounded bg-gray-100 text-sm">
                                            {u.role}
                                        </span>
                                    </td>

                                    <td className="p-4">

                                        <div className="flex gap-2">

                                            <button
                                                onClick={() =>
                                                    extenderTrial(u._id, 30)
                                                }
                                                className="bg-blue-600 text-white px-3 py-1 rounded"
                                            >
                                                +30 días
                                            </button>

                                            <button
                                                onClick={() =>
                                                    eliminarUsuario(u._id)
                                                }
                                                className="bg-red-500 text-white px-3 py-1 rounded"
                                            >
                                                Eliminar
                                            </button>

                                        </div>

                                    </td>

                                </tr>

                            ))}

                    </tbody>

                </table>

            </div>

        </div>
    );
}