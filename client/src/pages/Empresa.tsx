import { useEffect, useState } from "react";
import api from "../api/api";

interface Empresa {
    nombre: string;
    rut: string;
    direccion: string;
    telefono: string;
    email: string;
}

export default function Empresa() {

    const [empresa, setEmpresa] = useState<Empresa>({
        nombre: "",
        rut: "",
        direccion: "",
        telefono: "",
        email: ""
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {

        cargarEmpresa();

    }, []);

    const cargarEmpresa = async () => {

        try {

            const res = await api.get("/empresas/configuracion");

            if (res.data) {

                setEmpresa(res.data);

            }

        } catch (error) {

            console.error(error);

        } finally {

            setLoading(false);

        }

    };

    if (loading) {

        return (
            <div className="p-10">
                Cargando configuración...
            </div>
        );

    }

    return (

        <div className="max-w-5xl mx-auto p-8">

            <h1 className="text-3xl font-bold mb-8">

                Configuración de Empresa

            </h1>

            <div className="bg-white rounded-2xl shadow p-8">

                <div className="grid md:grid-cols-2 gap-6">

                    <div>

                        <label className="text-sm font-medium">

                            Nombre

                        </label>

                        <input

                            value={empresa.nombre}

                            readOnly

                            className="mt-2 w-full border rounded-lg p-3"

                        />

                    </div>

                    <div>

                        <label className="text-sm font-medium">

                            RUT

                        </label>

                        <input

                            value={empresa.rut}

                            readOnly

                            className="mt-2 w-full border rounded-lg p-3"

                        />

                    </div>

                    <div>

                        <label className="text-sm font-medium">

                            Dirección

                        </label>

                        <input

                            value={empresa.direccion}

                            readOnly

                            className="mt-2 w-full border rounded-lg p-3"

                        />

                    </div>

                    <div>

                        <label className="text-sm font-medium">

                            Teléfono

                        </label>

                        <input

                            value={empresa.telefono}

                            readOnly

                            className="mt-2 w-full border rounded-lg p-3"

                        />

                    </div>

                    <div className="md:col-span-2">

                        <label className="text-sm font-medium">

                            Email

                        </label>

                        <input

                            value={empresa.email}

                            readOnly

                            className="mt-2 w-full border rounded-lg p-3"

                        />

                    </div>

                </div>

            </div>

        </div>

    );

}