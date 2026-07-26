import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { useAuthStore } from './store/authStore';
import { authApi } from './api';

// Hydrate auth on boot
async function bootstrap() {
  const { accessToken, setUser, logout } = useAuthStore.getState();
  if (accessToken) {
    try {
      const res = await authApi.getMe();
      setUser(res.data.user);
    } catch {
      // Token likely expired and refresh failed — log user out
      logout();
    }
  }

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

bootstrap();
