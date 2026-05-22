import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { API_BASE_URL } from '../utils/constants'

export const useSocket = (events = {}) => {
  const socketRef = useRef(null)

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    const token = localStorage.getItem('silm_token')

    // Initialize socket connection
    const socket = io(API_BASE_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    })

    socketRef.current = socket

    // Register active listeners passed in hook arguments
    Object.entries(events).forEach(([eventName, callback]) => {
      socket.on(eventName, callback)
    })

    socket.on('connect', () => {
      console.log(`🔌 Connected to real-time server: ${socket.id}`)
    })

    socket.on('connect_error', (error) => {
      console.error('🔌 Socket connection error:', error.message)
    })

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason)
    })

    // Cleanup on component unmount
    return () => {
      Object.keys(events).forEach((eventName) => {
        socket.off(eventName)
      })
      socket.disconnect()
    }
  }, [events])

  // Expose emit helper
  const emit = (eventName, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(eventName, data)
    } else {
      console.warn(`🔌 Cannot emit '${eventName}': socket disconnected.`)
    }
  }

  return { socket: socketRef.current, emit }
}
