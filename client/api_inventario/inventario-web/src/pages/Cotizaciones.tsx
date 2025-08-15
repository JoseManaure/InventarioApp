// src/pages/Cotizaciones.tsx
import axios from 'axios';

import { useState, useEffect } from 'react';
import {  FileText } from 'lucide-react';
import api from '../api/api';
import type { Item } from '../types/Item';
import { generarGuiaPDF } from '../utils/pdf';
import { useParams } from 'react-router-dom';

import BuscadorProductos from '../components/BuscadorProductos';
import FormularioCliente from '../components/FormularioCliente';
import AccionesCotizacion from '../components/AccionesCotizacion';
import ResumenTablaProductos from '../components/ResumenTablaProductos';

export default function Cotizaciones() {
  const { id } = useParams<{ id: string }>();

  // Estados generales
  const [cliente, setCliente] = useState('');
  const [rutCliente, setRutCliente] = useState('');
  const [direccion, setDireccion] = useState('');
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [tipo, setTipo] = useState<'cotizacion' | 'nota'>('cotizacion');
  const [correlativo, setCorrelativo] = useState<number | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [busqueda, setBusqueda] = useState('');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
const [precios, setPrecios] = useState<Record<string, number>>({})

  // Campos adicionales cliente
  const [giroCliente, setGiroCliente] = useState('');
  const [direccionCliente, setDireccionCliente] = useState('');
  const [comunaCliente, setComunaCliente] = useState('');
  const [ciudadCliente, setCiudadCliente] = useState('Santiago');
  const [atencion, setAtencion] = useState('');
  const [emailCliente, setEmailCliente] = useState('');
  const [telefonoCliente, setTelefonoCliente] = useState('');
const [productos, setProductos] = useState<any[]>([]);
const [preciosPersonalizados, setPreciosPersonalizados] = useState<Record<string, number>>({});

  
useEffect(() => {
  if (!id) return;

  api.get(`/cotizaciones/${id}`)
    .then(res => {
      const d = res.data;

      setCliente(d.cliente || '');
      setRutCliente(d.rutCliente || '');
      setDireccionCliente(d.direccionCliente || '');
      setComunaCliente(d.comunaCliente || '');
      setCiudadCliente(d.ciudadCliente || '');
      setFechaEntrega(d.fechaEntrega || '');
      setMetodoPago(d.metodoPago || 'efectivo');
      setTipo(d.tipo || 'cotizacion');
      setGiroCliente(d.giroCliente || '');
      setAtencion(d.atencion || '');
      setEmailCliente(d.emailCliente || '');
      setTelefonoCliente(d.telefonoCliente || '');

      const preciosIniciales: Record<string, number> = {};
      const preciosPersIniciales: Record<string, number> = {};

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (d.productos || []).forEach((p: any) => {
        const idProd = p.itemId || p._id;
        preciosIniciales[idProd] = p.precio || 0;
        preciosPersIniciales[idProd] = p.precio || 0; // 👈 aquí guardamos también
      });

      setProductos(d.productos || []);
      setPrecios(preciosIniciales);
      setPreciosPersonalizados(preciosPersIniciales); // 👈 importante
    })
    .catch(err => {
      console.error("Error cargando cotización:", err);
    });
}, [id]);





  // Cargar lista completa de productos
  useEffect(() => {
    api.get('/items').then(res => setItems(res.data)).catch(console.error);
  }, []);


  



  // Funciones para manejo de productos seleccionados
 

  const eliminarProducto = (id: string) => {
    setSelectedItems(prev => {
      const copia = { ...prev };
      delete copia[id];
      return copia;
    });
  };

 

  const handlePrecioChange = (id: string, nuevoPrecio: number) => {
    setPreciosPersonalizados(prev => ({
      ...prev,
      [id]: nuevoPrecio,
    }));
      };

  const handleCantidadChange = (id: string, cantidad: number) => {
    setSelectedItems(prev => {
      const copia = { ...prev, [id]: cantidad };
      if (cantidad <= 0) delete copia[id];
      return copia;
    });
  };

  // Calcular resumen
  const calcularResumen = () => {
  const seleccionados = Object.entries(selectedItems).map(([id, cantidad]) => {
    const i = items.find(it => it._id === id);
      // Usa precio personalizado si existe, sino el original
  const precio = preciosPersonalizados[id] ?? (i?.precio ?? 0);
    return {
      id,
      nombre: i?.nombre ?? '[Eliminado]',
      cantidad,
      precio,
      total: precio * cantidad,
    };
  });
  const subtotal = seleccionados.reduce((a, p) => a + p.total, 0);
  const iva = subtotal * 0.19;
  return { seleccionados, subtotal, iva, total: subtotal + iva };
};



  // Guardar borrador
  const guardarBorrador = async () => {
    const { seleccionados, total } = calcularResumen();
    try {
      await api.post('/cotizaciones/borrador', {
        cliente,
         direccion, 
         fechaEntrega,
        metodoPago,
         tipo: "cotizacion",
         total,      
         rutCliente,
        giroCliente,
        direccionCliente,
        comunaCliente,
        ciudadCliente,
        atencion,
        emailCliente,
        telefonoCliente,
        estado:"borrador",
        
        productos: seleccionados.map(p => ({
          itemId: p.id,
          cantidad: p.cantidad,
          precio: p.precio,
          total: p.total,
    
        })),
      });
      alert('✅ Borrador guardado');
      navigate("/borradores");
    } catch {
      alert('❌ Error al guardar borrador');
    }
  };

// Enviar cotización o nota de venta
const enviarCotizacion = async () => {
  if (enviando) return;
  setEnviando(true);

  if (id) {
    await actualizarCotizacion();
    setEnviando(false);
    return;
  }

  const { seleccionados } = calcularResumen();

  if (tipo === 'nota') {
    for (const p of seleccionados) {
      const i = items.find(it => it._id === p.id);
      if (!i) continue;
      if (p.cantidad > i.cantidad) {
        alert(`⚠️ Advertencia: "${p.nombre}" no tiene suficiente stock. El stock quedará en negativo.`);
      }
    }
  }

  try {
    const res = await api.post('/cotizaciones', {
      cliente,
      direccion,
      rutCliente,
      giroCliente,
      direccionCliente,
      comunaCliente,
      ciudadCliente,
      atencion,
      emailCliente,
      telefonoCliente,
      fechaHoy: new Date().toLocaleDateString(),
      fechaEntrega,
      metodoPago,
      tipo,
      productos: seleccionados.map(p => ({
        itemId: p.id, 
        cantidad: p.cantidad,
        precio: preciosPersonalizados[p.id] ?? p.precio, // ✅ precio personalizado
      })),
    });
    setCorrelativo(res.data.numero);

    // Generar PDF usando precios personalizados
    const productosParaPDF = seleccionados.map(p => ({
      ...p,
      precio: preciosPersonalizados[p.id] ?? p.precio,
    }));

    const pdfBlob = generarGuiaPDF(cliente, productosParaPDF, {
      fechaEntrega,
      metodoPago,
      tipoDocumento: tipo,
      rutCliente,
      numeroDocumento: res.data.numero,
      giroCliente,
      direccionCliente,
      comunaCliente,
      ciudadCliente,
      atencion,
      emailCliente,
      telefonoCliente,
      tipo,
      direccion,
    });

    const url = URL.createObjectURL(pdfBlob);
    setPdfUrl(url);

    const fd = new FormData();
    fd.append('file', new File([pdfBlob], 'doc.pdf', { type: 'application/pdf' }));
    fd.append('cotizacionId', res.data._id);
    await api.post('/cotizaciones/upload-pdf', fd);

    alert('✅ Documento creado');
    resetFormulario();
  } catch (err) {
    console.error(err);
    alert('❌ Error al crear');
  }
  setEnviando(false);
};

// Actualizar cotización
const actualizarCotizacion = async () => {
  const { seleccionados } = calcularResumen();
  try {
    const res = await api.put(`/cotizaciones/${id}`, {
      cliente,
      direccion,
      rutCliente,
      giroCliente,
      direccionCliente,
      comunaCliente,
      ciudadCliente,
      atencion,
      emailCliente,
      telefonoCliente,
      fechaHoy: new Date().toLocaleDateString(),
      fechaEntrega,
      metodoPago,
      tipo,
      productos: seleccionados.map(p => ({
        itemId: p.id,
        cantidad: p.cantidad,
        precio: preciosPersonalizados[p.id] ?? p.precio, // ✅ precio personalizado
      })),
    });

    setCorrelativo(res.data.numero);

    // Generar PDF usando precios personalizados
    const productosParaPDF = seleccionados.map(p => ({
      ...p,
      precio: preciosPersonalizados[p.id] ?? p.precio,
    }));

    const pdfBlob = generarGuiaPDF(cliente, productosParaPDF, {
      fechaEntrega,
      metodoPago,
      tipoDocumento: tipo,
      rutCliente,
      numeroDocumento: res.data.numero,
      giroCliente,
      direccionCliente,
      comunaCliente,
      ciudadCliente,
      atencion,
      emailCliente,
      telefonoCliente,
      tipo,
      direccion,
    });

    const url = URL.createObjectURL(pdfBlob);
    setPdfUrl(url);

    const fd = new FormData();
    fd.append('file', new File([pdfBlob], 'doc.pdf', { type: 'application/pdf' }));
    fd.append('cotizacionId', res.data._id);
    await api.post('/cotizaciones/upload-pdf', fd);

    alert('✅ Cotización actualizada');
  } catch (err) {
    console.error(err);
    alert('❌ Error al actualizar cotización');
  }
};


  // Reset formulario
  const resetFormulario = () => {
    setCliente('');
    setRutCliente('');
    setDireccion('');
    setFechaEntrega('');
    setMetodoPago('efectivo');
    setTipo('cotizacion');
    setSelectedItems({});
    setBusqueda('');
    setGiroCliente('');
    setDireccionCliente('');
    setComunaCliente('');
    setCiudadCliente('Santiago');
    setAtencion('');
    setEmailCliente('');
    setTelefonoCliente('');
    setPdfUrl(null);
    setCorrelativo(null);
  };

  const { seleccionados, subtotal, iva, total } = calcularResumen();

  return (
    
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
        <FileText className="w-6 h-6 text-blue-600" />
        DOCUMENTO
      </h1>

      <AccionesCotizacion
        onGuardarBorrador={guardarBorrador}
        onConfirmar={enviarCotizacion}
        enviando={enviando}
        pdfUrl={pdfUrl}
        correlativo={correlativo}
        tipo={tipo}
      />
        <br></br>

            <FormularioCliente
        cliente={cliente}
        setCliente={setCliente}   
        rutCliente={rutCliente}
        setRutCliente={setRutCliente}
        direccion={direccion}
        setDireccion={setDireccion}
        fechaEntrega={fechaEntrega}
        setFechaEntrega={setFechaEntrega}
        disableTipo={!!id} 
        metodoPago={metodoPago}
        setMetodoPago={setMetodoPago}
        tipo={tipo}
        setTipo={setTipo}
        giroCliente={giroCliente}
        setGiroCliente={setGiroCliente}
        direccionCliente={direccionCliente}
        setDireccionCliente={setDireccionCliente}
        comunaCliente={comunaCliente}
        setComunaCliente={setComunaCliente}
        ciudadCliente={ciudadCliente}
        setCiudadCliente={setCiudadCliente}
        atencion={atencion}
        setAtencion={setAtencion}
        emailCliente={emailCliente}
        setEmailCliente={setEmailCliente}
        telefonoCliente={telefonoCliente}
        setTelefonoCliente={setTelefonoCliente}
        
      />

     
     
          <BuscadorProductos
            busqueda={busqueda}
            setBusqueda={setBusqueda}
            onAgregar={(item) => {
              setSelectedItems((prev) => ({
                ...prev,
                [item._id]: (prev[item._id] || 0) + 1
              }));
            }}
            />


        <ResumenTablaProductos
            seleccionados={seleccionados}
            subtotal={subtotal}
            iva={iva}
            total={total}
            onCantidadChange={handleCantidadChange}
            onEliminar={eliminarProducto}
            onPrecioChange={handlePrecioChange}
          />
      
      

        </div>
    
        );
      }
