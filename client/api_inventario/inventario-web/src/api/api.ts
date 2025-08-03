import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api', // o usa import.meta.env.VITE_API_URL si ya tienes .env
});

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export default api;
