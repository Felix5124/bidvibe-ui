import { useEffect, useRef } from "react";
import { useAuthStore } from "../store/authStore";
import { useNotificationStore } from "../store/notificationStore";
import { useToast } from "../context/ToastContext";
import { getSocket } from "../lib/socket";

export function useNotificationSubscription() {
  const { user } = useAuthStore();
  const { addNotification, incrementUnread } = useNotificationStore();
  const { info: showInfoToast } = useToast();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user?.id) return;

    const socket = getSocket();
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[Notifications] Socket.io connected");
    });

    // Server Node.js của bạn bắn event tên là 'notification'
    socket.on("notification", (payload) => {
      console.log("[Notifications] Received notification:", payload);

      addNotification({
        id: payload.notificationId || payload.id || crypto.randomUUID(),
        type: payload.type,
        title: payload.title,
        content: payload.content,
        read: false,
        createdAt: payload.createdAt || new Date().toISOString(),
        referenceId: payload.referenceId,
      });

      incrementUnread();
      showInfoToast(payload.title, payload.content);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.off("notification");
        socketRef.current = null;
      }
    };
  }, [user?.id, addNotification, incrementUnread, showInfoToast]);
}
