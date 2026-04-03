import { useEffect, useRef } from 'react'
import { useAuthStore } from '../store/authStore'
import { useNotificationStore } from '../store/notificationStore'
import { useToast } from '../context/ToastContext'
import { createStompClient } from '../lib/stomp'

export function useNotificationSubscription() {
  const { user } = useAuthStore()
  const { addNotification, incrementUnread } = useNotificationStore()
  const { info: showInfoToast } = useToast()
  const clientRef = useRef(null)
  const hasConnectedRef = useRef(false)

  useEffect(() => {
    if (!user?.id) return

    const client = createStompClient({
      onConnect: () => {
        hasConnectedRef.current = true
        console.log('[Notifications] WebSocket connected')
        
        // Subscribe to user-specific notification topic
        client.subscribe(`/topic/notification/${user.id}`, (message) => {
          try {
            const payload = JSON.parse(message.body)
            console.log('[Notifications] Received notification:', payload)
            
            // Add to store
            addNotification({
              id: payload.notificationId || payload.id || crypto.randomUUID(),
              type: payload.type,
              title: payload.title,
              content: payload.content,
              read: false,
              createdAt: payload.createdAt || new Date().toISOString(),
              referenceId: payload.referenceId,
            })
            
            // Increment unread count
            incrementUnread()
            
            // Show toast notification
            showInfoToast(payload.title, payload.content)
          } catch (err) {
            console.error('[Notifications] Failed to parse notification:', err)
          }
        })
      },
      onStompError: (frame) => {
        console.error('[Notifications] STOMP error:', frame)
      },
      onWebSocketError: (event) => {
        // SockJS can emit transient errors before the first successful handshake.
        if (!hasConnectedRef.current) {
          return
        }
        console.warn('[Notifications] WebSocket unstable, waiting for reconnect:', event)
      },
    })

    clientRef.current = client

    return () => {
      if (clientRef.current) {
        clientRef.current.deactivate()
        clientRef.current = null
      }
      hasConnectedRef.current = false
    }
  }, [user?.id, addNotification, incrementUnread, showInfoToast])
}