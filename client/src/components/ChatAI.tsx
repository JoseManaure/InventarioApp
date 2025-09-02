import { useState } from "react";
import { Button } from "./ui/button";

export default function ChatAI() {
  const [input, setInput] = useState("");
  const [respuesta, setRespuesta] = useState("");
  const [loading, setLoading] = useState(false);

  const enviarPregunta = async () => {
    if (!input.trim()) return;
    setLoading(true);

    try {
      const res = await fetch("http://localhost:3000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });
      const data = await res.json();
      setRespuesta(data.reply);
    } catch (error) {
      setRespuesta("Error al conectarse al chat.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md max-w-xl mx-auto mt-10">
      <h2 className="text-lg font-bold mb-4">💬 Chat AI</h2>
      <textarea
        rows={3}
        className="w-full p-2 border rounded-lg mb-3"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Escribe tu pregunta..."
      />
      <Button onClick={enviarPregunta} className="mb-4" disabled={loading}>
        {loading ? "Enviando..." : "Enviar"}
      </Button>
      {respuesta && (
        <div className="bg-gray-100 p-3 rounded-lg text-gray-800 whitespace-pre-wrap">
          {respuesta}
        </div>
      )}
    </div>
  );
}
