import { useState } from 'react';
import api, { setAuthToken } from '../api/api';
import type { User } from '../types/User';

interface LoginProps {
  onLogin: (user: User) => void;
}



export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const login = async () => {
  try {
    console.log('🟡 Enviando login:', { email, password });

    const res = await api.post('/auth/login', { email, password });

    console.log('🟢 Login exitoso:', res.data);
    
    localStorage.setItem('token', res.data.token); // ✅ Guarda el token

    setAuthToken(res.data.token);
    onLogin(res.data.user);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error('🔴 Error en login:', err.response?.data || err.message);
    alert('Credenciales inválidas');
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
