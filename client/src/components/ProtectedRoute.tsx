import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({
    children
}: {
    children: React.ReactNode;
}) {

    const {
        user,
        loading
    } = useAuth();

    // Esperando respuesta de /auth/me
    if (loading) {

        return (
            <div className="h-screen flex items-center justify-center">
                Cargando...
            </div>
        );

    }

    // No hay sesión
    if (!user) {

        return <Navigate to="/" replace />;

    }

    // Sesión válida
    return <>{children}</>;

}