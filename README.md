# 🧮 Inventario Rasiva

**Inventario Rasiva** es una aplicación web de gestión de inventario y ventas desarrollada con **React**, **TypeScript**, **Node.js**, **Express** y **MongoDB**.

Permite a pequeñas y medianas empresas llevar control de productos, generar cotizaciones y documentos de venta como facturas, notas de venta y guías de despacho. Todo desde una interfaz moderna, ágil y fácil de usar.

## 🚀 Funcionalidades principales

- 📦 Gestión de productos con stock y control de reservas
- 🧾 Generación de cotizaciones en PDF con diseño profesional
- 📄 Conversión de cotizaciones en notas de venta, facturas o guías
- 💾 Guardado de borradores de cotización
- 🧑‍💼 Registro de clientes con campos personalizados
- 📥 Subida automática de archivos PDF al backend
- 🛠️ Administración de números correlativos y control de duplicados
- 🔐 Autenticación con tokens (JWT) para proteger rutas

## 🖥️ Tecnologías utilizadas

- **Frontend:**
  - React + TypeScript
  - Tailwind CSS
  - Axios
  - jsPDF + jspdf-autotable (para generar PDFs)

- **Backend:**
  - Node.js + Express
  - MongoDB + Mongoose
  - Multer (para manejo de archivos)

## 📸 Capturas de pantalla

_Agrega aquí screenshots de las vistas más importantes:_
- Crear cotización
- Tabla de productos
- PDF generado
- Formulario de cliente

## ⚙️ Instalación local

```bash
# Clona el repositorio
git clone https://github.com/tuusuario/inventario-web.git

# Entra a la carpeta
cd inventario-web

# Instala dependencias del frontend
npm install

# En otro terminal, ve al backend y ejecuta:
cd api_inventario
npm install

# Corre frontend y backend (usa nodemon si tienes)
npm run dev
