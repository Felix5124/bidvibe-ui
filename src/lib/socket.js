import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

let socketInstance = null;
let socketToken = null;

const getCurrentToken = () => {
  return (
    sessionStorage.getItem("sb_jwt") || sessionStorage.getItem("authToken")
  );
};

export const getSocket = () => {
  const token = getCurrentToken();

  if (!token) {
    return null;
  }

  if (socketInstance && socketToken === token) {
    return socketInstance;
  }

  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }

  socketToken = token;
  socketInstance = io(API_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
  });

  return socketInstance;
};

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
    socketToken = null;
  }
};
