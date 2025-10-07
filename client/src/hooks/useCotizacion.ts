import { useState, useEffect } from "react";
import api from "../api/api";
import type { Item } from "../types/Item";

export interface ProductoResumen {
  id: string;
  nombre: string;
  cantidad: number;
  precio: number;
  total: number;
}

export function useCotizacion(cotizacionId?: string) {
  const [cliente, setCliente] = useState('');
  const [rutCliente, setRutCliente] = useState('');
  const [direccion, setDireccion] = useState('');
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [tipo, setTipo] = useState<'cotizacion' | 'nota'>('cotizacion');
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItems, setSelectedItems] = useState<Record<string, { cantidad: number; nombre: string; precio: number }>>({});
  const [giroCliente, setGiroCliente] = useState('');
  const [direccionCliente, setDireccionCliente] = useState('');
  const [comunaCliente, setComunaCliente] = useState('');
  const [ciudadCliente, setCiudadCliente] = useState('');
  const [atencion, setAtencion] = useState('');
  const [emailCliente, setEmailCliente] = useState('');
  const [telefonoCliente, setTelefonoCliente] = useState('');
  const [formaPago, setFormaPago] = useState('');
  const [nota, setNota] = useState('');

  // 🔹 Cargar items y cotización si existe
  useEffect(() => {
    let mounted = true;

    const cargarItems = async () => {
      try {
        const res = await api.get('/items');
        if (!mounted) return;
        const data = Array.isArray(res.data) ? res.data : res.data.items || [];
        setItems(data);
      } catch (err) {
        console.error(err);
      }
    };

    const cargarCotizacion = async () => {
      if (!cotizacionId) return;
      try {
        const res = await api.get(`/cotizaciones/${cotizacionId}`);
        if (!mounted) return;
        const d = res.data;

        setCliente(d.cliente || '');
        setRutCliente(d.rutCliente || '');
        setDireccion(d.direccion || '');
        setFechaEntrega(d.fechaEntrega || '');
        setMetodoPago(d.metodoPago || 'efectivo');
        setTipo(d.tipo || 'cotizacion');
        setGiroCliente(d.giroCliente || '');
        setDireccionCliente(d.direccionCliente || '');
        setComunaCliente(d.comunaCliente || '');
        setCiudadCliente(d.ciudadCliente || '');
        setAtencion(d.atencion || '');
        setEmailCliente(d.emailCliente || '');
        setTelefonoCliente(d.telefonoCliente || '');
        setFormaPago(d.formaPago ?? "");
        setNota(d.nota ?? "");

        const seleccionadosIniciales: Record<string, { cantidad: number; nombre: string; precio: number }> = {};
        (d.productos || []).forEach((p: any) => {
          const idProd = (p.itemId?._id || p.itemId || p._id).toString();
          seleccionadosIniciales[idProd] = {
            cantidad: p.cantidad || 1,
            nombre: p.nombre || p.itemId?.nombre || '[Eliminado]',
            precio: p.precio || p.itemId?.precio || 0
          };
        });
        setSelectedItems(seleccionadosIniciales);

      } catch (err) {
        console.error(err);
      }
    };

    cargarItems();
    cargarCotizacion();

    return () => { mounted = false; }
  }, [cotizacionId]);

  // 🔹 Función para agregar un producto desde el buscador
  const agregarItem = (item: Item) => {
    setSelectedItems(prev => ({
      ...prev,
      [item._id.toString()]: {
        cantidad: (prev[item._id.toString()]?.cantidad || 0) + 1,
        nombre: item.nombre,
        precio: prev[item._id.toString()]?.precio ?? item.precio
      }
    }));
  };

  const handleCantidadChange = (id: string, cantidad: number) => {
    setSelectedItems(prev => {
      const copia = { ...prev };
      if (cantidad <= 0) delete copia[id];
      else copia[id] = { ...copia[id], cantidad };
      return copia;
    });
  };

  const handlePrecioChange = (id: string, precio: number) => {
    setSelectedItems(prev => ({ ...prev, [id]: { ...prev[id], precio } }));
  };

  const eliminarProducto = (id: string) => {
    setSelectedItems(prev => {
      const copia = { ...prev };
      delete copia[id];
      return copia;
    });
  };

  const calcularResumen = () => {
    const seleccionados: ProductoResumen[] = Object.entries(selectedItems).map(([id, data]) => ({
      id,
      nombre: data.nombre,
      cantidad: data.cantidad,
      precio: data.precio,
      total: data.cantidad * data.precio
    }));

    const subtotal = seleccionados.reduce((acc, p) => acc + p.total, 0);
    const iva = subtotal * 0.19;
    const total = subtotal + iva;

    return { seleccionados, subtotal, iva, total };
  };

  return {
    cliente, setCliente,
    rutCliente, setRutCliente,
    direccion, setDireccion,
    fechaEntrega, setFechaEntrega,
    metodoPago, setMetodoPago,
    tipo, setTipo,
    items,
    selectedItems,
    agregarItem,
    handleCantidadChange,
    handlePrecioChange,
    eliminarProducto,
    calcularResumen,
    giroCliente, setGiroCliente,
    direccionCliente, setDireccionCliente,
    comunaCliente, setComunaCliente,
    ciudadCliente, setCiudadCliente,
    atencion, setAtencion,
    emailCliente, setEmailCliente,
    telefonoCliente, setTelefonoCliente,
    formaPago, setFormaPago,
    nota, setNota,
  };
}
