import { useEffect, useState } from "react";
import api from "../api/api";

export default function Clientes() {

    const [clientes, setClientes] = useState<any[]>([]);
    const [mostrar, setMostrar] = useState(false);

    const [editando, setEditando] = useState<string | null>(null);


    const [form, setForm] = useState({

        nombre: "",
        rut: "",
        giro: "",
        direccion: "",
        comuna: "",
        ciudad: "",
        telefono: "",
        email: "",
        contacto: ""

    });



    const cargarClientes = async () => {

        try {

            const res = await api.get("/clientes");

            setClientes(res.data);

        } catch (error) {

            console.error(error);

        }

    };



    useEffect(() => {

        cargarClientes();

    }, []);




    const limpiarFormulario = () => {

        setForm({

            nombre: "",
            rut: "",
            giro: "",
            direccion: "",
            comuna: "",
            ciudad: "",
            telefono: "",
            email: "",
            contacto: ""

        });

        setEditando(null);

    };





    const guardarCliente = async () => {

        try {


            if (editando) {


                await api.put(
                    `/clientes/${editando}`,
                    form
                );


            } else {


                await api.post(
                    "/clientes",
                    form
                );


            }



            setMostrar(false);

            limpiarFormulario();

            cargarClientes();



        } catch (error) {

            console.error(error);

        }

    };







    const editarCliente = (cliente: any) => {


        setEditando(cliente._id);


        setForm({

            nombre: cliente.nombre || "",
            rut: cliente.rut || "",
            giro: cliente.giro || "",
            direccion: cliente.direccion || "",
            comuna: cliente.comuna || "",
            ciudad: cliente.ciudad || "",
            telefono: cliente.telefono || "",
            email: cliente.email || "",
            contacto: cliente.contacto || ""

        });


        setMostrar(true);


    };








    const eliminarCliente = async (id: string) => {


        const confirmar = window.confirm(
            "¿Eliminar cliente?"
        );


        if (!confirmar) return;



        try {


            await api.delete(
                `/clientes/${id}`
            );


            cargarClientes();



        } catch (error) {

            console.error(error);

        }


    };







    return (

        <div className="space-y-5">



            <div className="flex justify-between items-center">


                <h1 className="text-2xl font-bold">
                    Clientes
                </h1>



                <button

                    onClick={() => {

                        limpiarFormulario();

                        setMostrar(true);

                    }}

                    className="
          bg-blue-600
          hover:bg-blue-700
          text-white
          px-4
          py-2
          rounded
          "

                >

                    Nuevo Cliente

                </button>


            </div>







            <div className="
      bg-white
      rounded-lg
      shadow
      overflow-hidden
      ">


                <table className="w-full text-sm">


                    <thead className="bg-gray-100">


                        <tr>

                            <th className="p-3 text-left">
                                Nombre
                            </th>


                            <th>
                                RUT
                            </th>


                            <th>
                                Teléfono
                            </th>


                            <th>
                                Ciudad
                            </th>


                            <th>
                                Acciones
                            </th>


                        </tr>


                    </thead>



                    <tbody>


                        {
                            clientes.map((c) => (


                                <tr
                                    key={c._id}
                                    className="border-t"
                                >


                                    <td className="p-3">
                                        {c.nombre}
                                    </td>


                                    <td className="text-center">
                                        {c.rut}
                                    </td>


                                    <td className="text-center">
                                        {c.telefono}
                                    </td>


                                    <td className="text-center">
                                        {c.ciudad}
                                    </td>



                                    <td className="text-center space-x-2">


                                        <button

                                            onClick={() => editarCliente(c)}

                                            className="
                      bg-yellow-500
                      text-white
                      px-3
                      py-1
                      rounded
                      "

                                        >

                                            Editar

                                        </button>




                                        <button

                                            onClick={() => eliminarCliente(c._id)}

                                            className="
                      bg-red-600
                      text-white
                      px-3
                      py-1
                      rounded
                      "

                                        >

                                            Eliminar

                                        </button>



                                    </td>


                                </tr>


                            ))
                        }



                    </tbody>


                </table>


            </div>









            {
                mostrar && (


                    <div className="
          fixed
          inset-0
          bg-black/40
          flex
          items-center
          justify-center
          z-50
          ">


                        <div className="
            bg-white
            rounded-xl
            p-6
            w-[500px]
            space-y-4
            ">


                            <h2 className="text-lg font-bold">

                                {
                                    editando
                                        ? "Editar Cliente"
                                        : "Nuevo Cliente"
                                }

                            </h2>





                            {
                                Object.keys(form).map((campo) => (


                                    <input

                                        key={campo}

                                        placeholder={campo}

                                        value={(form as any)[campo]}

                                        onChange={(e) => setForm({

                                            ...form,

                                            [campo]: e.target.value

                                        })}


                                        className="
                    border
                    rounded
                    px-3
                    py-2
                    w-full
                    "

                                    />


                                ))
                            }





                            <div className="flex justify-end gap-3">



                                <button

                                    onClick={() => {

                                        setMostrar(false);

                                        limpiarFormulario();

                                    }}

                                    className="
                  bg-gray-300
                  px-4
                  py-2
                  rounded
                  "

                                >

                                    Cancelar

                                </button>




                                <button

                                    onClick={guardarCliente}

                                    className="
                  bg-blue-600
                  text-white
                  px-4
                  py-2
                  rounded
                  "

                                >

                                    Guardar

                                </button>




                            </div>



                        </div>


                    </div>


                )
            }



        </div>

    );

}