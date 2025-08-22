// src/pages/Dashboard.tsx
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { FileText, Package, ClipboardList, Inbox } from "lucide-react";
import ChatAI from "../components/ChatAI";

export default function Dashboard() {
  const userName = "Jose Manaure"; // vendrá del backend

  const shortcuts = [
    { title: "Listas de precios", icon: <ClipboardList className="w-7 h-7 text-indigo-600" /> },
    { title: "Documentos", icon: <FileText className="w-7 h-7 text-blue-600" /> },
    { title: "Stock actual", icon: <Package className="w-7 h-7 text-orange-600" /> },
    { title: "Recepción", icon: <Inbox className="w-7 h-7 text-green-600" /> },
  ];
return (
  <div className="p-10 min-h-screen bg-gray-50">
    {/* Bienvenida */}
    <h1 className="text-3xl font-bold text-gray-800 mb-8">
      Hola, {userName}
    </h1>

    {/* Accesos rápidos */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      {shortcuts.map((item, idx) => (
        <Card
          key={idx}
          className="rounded-2xl shadow-md hover:shadow-xl transition-all cursor-pointer group"
        >
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="w-16 h-16 flex items-center justify-center bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform">
              {item.icon}
            </div>
            <p className="mt-5 text-lg font-medium text-gray-700 group-hover:text-gray-900">
              {item.title}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>

    {/* Chat AI */}
    <ChatAI />

    {/* Personalización */}
    <div className="text-center mt-10">
      <p className="text-xl font-semibold text-gray-700 mb-2">
        Sácale el máximo potencial a tu página de inicio
      </p>
      <p className="text-gray-500 mb-6">
        Agrega resúmenes de ventas, eventos y más...
      </p>
      <Button className="px-6 py-2 rounded-xl shadow-md">
        Personalizar
      </Button>
    </div>
  </div>
)}
