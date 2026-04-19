import axios from 'axios';

// Con el proxy de Vite, /api/* se redirige automáticamente a http://localhost:3001
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

export default api;
