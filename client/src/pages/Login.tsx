import { useState } from 'react';
import api from '../api/api';
import { useAuth } from "../context/AuthContext";
import { useNavigate } from 'react-router-dom';


export default function Login() {
  const { login: authLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const login = async () => {
    try {

      console.log('🟡 Enviando login:', {
        email,
        password
      });

      const res = await api.post(
        "/auth/login",
        {
          email,
          password
        }
      );

      authLogin(
        res.data.token,
        res.data.user
      );

      navigate("/dashboard-ventas");

    } catch (err: any) {

      console.error(
        '🔴 Error en login:',
        err.response?.data || err.message
      );

      alert(
        'Credenciales inválidas'
      );
    }
  };

  return (
    <div style={{ padding: 50 }}>
      <h2>Login</h2>
      <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
      <br />
      <input
        placeholder="Contraseña"
        type="password"
        onChange={(e) => setPassword(e.target.value)}
      />
      <br />
      <button onClick={login}>Iniciar sesión</button>
    </div>
  );
}
