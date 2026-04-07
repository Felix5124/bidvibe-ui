/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(
    (message, type = "info", duration = 4000, title = null, options = {}) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [
        ...prev,
        { id, message, type, duration, title, ...options },
      ]);
      return id;
    },
    [],
  );

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback(
    (message, duration) => {
      return addToast(message, "success", duration);
    },
    [addToast],
  );

  const error = useCallback(
    (message, duration) => {
      return addToast(message, "error", duration);
    },
    [addToast],
  );

  const info = useCallback(
    (title, message, duration, options = {}) => {
      if (message) {
        return addToast(message, "info", duration, title, options);
      }
      return addToast(title, "info", duration, null, options);
    },
    [addToast],
  );

  const warning = useCallback(
    (message, duration) => {
      return addToast(message, "warning", duration);
    },
    [addToast],
  );

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, removeToast, success, error, info, warning }}
    >
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export default ToastContext;
