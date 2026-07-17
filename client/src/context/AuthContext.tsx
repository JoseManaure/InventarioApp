import {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";

import api, { setAuthToken } from "../api/api";
import type { User } from "../types/User";

interface AuthContextType {
    user: User | null;
    loading: boolean;

    login: (token: string, user: User) => void;

    logout: () => void;
}

const AuthContext = createContext<AuthContextType>(
    {} as AuthContextType
);

export function AuthProvider({
    children
}: {
    children: React.ReactNode;
}) {

    const [user, setUser] =
        useState<User | null>(null);

    const [loading, setLoading] =
        useState(true);

    useEffect(() => {

        const token =
            localStorage.getItem("token");

        if (!token) {

            setLoading(false);

            return;

        }

        setAuthToken(token);

        api.get("/auth/me")
            .then(res => {

                setUser(res.data);

            })
            .catch(() => {

                logout();

            })
            .finally(() => {

                setLoading(false);

            });

    }, []);

    useEffect(() => {

        const handleStorage = (event: StorageEvent) => {

            if (event.key === "logout-event") {

                setUser(null);

                setAuthToken(null);

                window.location.href = "/";

            }

        };

        window.addEventListener(
            "storage",
            handleStorage
        );

        return () => {

            window.removeEventListener(
                "storage",
                handleStorage
            );

        };

    }, []);

    const login = (
        token: string,
        userData: User
    ) => {

        localStorage.setItem(
            "token",
            token
        );

        localStorage.setItem(
            "user",
            JSON.stringify(userData)
        );

        setAuthToken(token);

        setUser(userData);

    };

    const logout = () => {

        localStorage.removeItem("token");

        localStorage.removeItem("user");

        setAuthToken(null);

        setUser(null);

        // sincronizar otras pestañas
        localStorage.setItem(
            "logout-event",
            Date.now().toString()
        );

    };

    return (

        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                logout
            }}
        >

            {children}

        </AuthContext.Provider>

    );

}

export const useAuth = () =>
    useContext(AuthContext);