/// <reference types="vitest" />

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Cotizaciones from "../pages/Cotizaciones";
import { BrowserRouter } from "react-router-dom";
import api from "../api/api";

// 🔹 Mock global de API
vi.mock('../api/api', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: [{ _id: '1', nombre: 'Producto Test', precio: 1000, cantidad: 10 }] })),
    post: vi.fn(() => Promise.resolve({ data: { numero: 123, _id: 'abc' } })),
    put: vi.fn(() => Promise.resolve({ data: { numero: 123, _id: 'abc' } }))
  },
}));

// 🔹 Producto de prueba
const productoTest = {
  _id: '1',
  nombre: 'Producto Test',
  precio: 1000,
  cantidad: 10
};

describe("Cotizaciones UI + cálculo de precios", () => {
  it("muestra título DOCUMENTO y agrega un producto correctamente", async () => {
    render(
      <BrowserRouter>
        <Cotizaciones />
      </BrowserRouter>
    );

    // 🔹 Verifica que el título DOCUMENTO aparece
    const titulo = screen.getByText(/DOCUMENTO/i);
    expect(titulo).toBeInTheDocument();

    // 🔹 Encuentra el input de búsqueda
    const inputBusqueda = screen.getByPlaceholderText(/Buscar por nombre o código/i);
    expect(inputBusqueda).toBeInTheDocument();

    // 🔹 Escribe el nombre del producto
    fireEvent.change(inputBusqueda, { target: { value: productoTest.nombre } });

    // 🔹 Espera a que aparezca el producto en la lista de resultados
    const itemProducto = await screen.findByText(productoTest.nombre);
    expect(itemProducto).toBeInTheDocument();

    // 🔹 Click sobre el producto para agregarlo
    fireEvent.click(itemProducto);

    // 🔹 Espera a que el producto aparezca en la tabla de selección
    await waitFor(() => {
      expect(screen.getByText(productoTest.nombre)).toBeInTheDocument();
    });

    // 🔹 Verifica subtotal, IVA y total (1000, 19%, 1190)
    expect(screen.getByText(/\$1.000/)).toBeInTheDocument(); // subtotal
    expect(screen.getByText(/\$190/)).toBeInTheDocument();   // IVA 19%
    expect(screen.getByText(/\$1.190/)).toBeInTheDocument(); // total
  });
});
