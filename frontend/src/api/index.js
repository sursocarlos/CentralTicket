// Este archivo es el puente entre el backend y el frontend.
// Para este punte usamos axios.
// En vez de importarlo directamente en cada componente
// creamos una instancia configurada aquí y la importamos desde cualquier sitio.

import axios from "axios";

// Creamos una instancia de Axios con la URL base del backend
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

// Interceptamos todas la peticiones antes de que salgan.
// Cogemos el token del localStorage y lo añadimos a la cabecera Authorization.
// De esta forma no tenemos que acordarnos de mandarlo manualmente en cada llamada a la API
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ct_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

//Intercepta todas las respuestas, si todo va bien las deja pasar sin tocarlas.
// Si la respuesta es un error 401 (token expirado o inválido),
// limpia el localStorage y redirige al login automáticamente.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("ct_token");
      localStorage.removeItem("ct_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default api;
