import { io } from "socket.io-client";

const isProd = import.meta.env.VITE_ENVIRONMENT === "prod";

const SERVER_URL = isProd
  ? import.meta.env.VITE_BACKEND_USER_API_URL_PROD
  : import.meta.env.VITE_BACKEND_USER_API_URL_DEV;

export const socket = io(SERVER_URL, {
  autoConnect: false,
  transports: ["websocket"],
});

export const API_URL = SERVER_URL;
