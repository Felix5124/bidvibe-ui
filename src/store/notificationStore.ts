import { create } from 'zustand'

export interface Notification {
  id: string
  type: string
  title: string
  content: string
  read: boolean
  createdAt: string
  referenceId?: string
}

interface NotificationStore {
  notifications: Notification[]
  unreadCount: number
  setNotifications: (notifications: Notification[]) => void
  addNotification: (notification: Notification) => void
  setUnreadCount: (count: number) => void
  incrementUnread: () => void
  decrementUnread: () => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clear: () => void
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  setNotifications: (notifications) => {
    const unreadCount = notifications.filter((n) => !n.read).length
    set({ notifications, unreadCount })
  },

  addNotification: (notification) => {
    const current = get().notifications
    const exists = current.some((n) => n.id === notification.id)
    if (exists) return

    set({
      notifications: [notification, ...current],
      unreadCount: get().unreadCount + (notification.read ? 0 : 1),
    })
  },

  setUnreadCount: (count) => set({ unreadCount: count }),

  incrementUnread: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),

  decrementUnread: () => set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),

  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }))
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }))
  },

  clear: () => set({ notifications: [], unreadCount: 0 }),
}))