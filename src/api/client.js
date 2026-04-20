import axios from 'axios';

// Usar VITE_API_URL si está definido (producción), si no usar proxy relativo '/api' para dev
let baseURL = import.meta.env.VITE_API_URL || '/api';
if (baseURL && baseURL !== '/api') {
  baseURL = baseURL.replace(/\/$/, ''); // quitar slash final
  if (!baseURL.endsWith('/api')) baseURL = baseURL + '/api';
}

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

export default api;
