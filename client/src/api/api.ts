import axios from "axios";
import { forceLogout } from "../utils/logout";
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

export const deleteCotizacion = async (id: string) => {
  return await api.delete(`/cotizaciones/${id}`);
};

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
};


// ✅ interceptor global
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      console.log("⚠️ Sesión expirada");
      forceLogout();
    }

    return Promise.reject(error);
  }
);

export default api;