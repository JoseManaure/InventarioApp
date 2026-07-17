import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface Props {
    children: React.ReactNode;
    roles: string[];
}

export default function RoleRoute({
    children,
    roles
}: Props) {

    const { user, loading } = useAuth();

    if (loading) {
        return <div>Cargando...</div>;
    }

    if (!user) {
        return <Navigate to="/" replace />;
    }

    if (!roles.includes(user.role)) {
        return <Navigate to="/dashboard-ventas" replace />;
    }

    return <>{children}</>;
}