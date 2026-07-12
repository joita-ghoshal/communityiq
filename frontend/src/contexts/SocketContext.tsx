'use client';
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth.store';
import toast from 'react-hot-toast';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: number;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false, onlineUsers: 0 });

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const connectSocket = () => {
      const token = localStorage.getItem('access_token');
      if (!token || socketRef.current?.connected) return;

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const WS_URL = API_URL.replace('/api/v1', '').replace('/api', '');

      try {
        const newSocket = io(WS_URL, {
          auth: { token },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionDelay: 2000,
          reconnectionAttempts: 5,
        });

        newSocket.on('connect', () => {
          setIsConnected(true);
        });

        newSocket.on('disconnect', () => {
          setIsConnected(false);
        });

        newSocket.on('notification', (data: any) => {
          if (data?.title) {
            toast(data.title, {
              icon: data.type === 'emergency_alert' ? '🚨' : '🔔',
              duration: data.type === 'emergency_alert' ? 10000 : 5000,
            });
          }
        });

        newSocket.on('emergency:alert', (data: any) => {
          if (data?.title) {
            toast.error(`🚨 EMERGENCY: ${data.title}`, { duration: 15000 });
          }
        });

        newSocket.on('connect_error', () => {
          setIsConnected(false);
        });

        socketRef.current = newSocket;
        setSocket(newSocket);
      } catch {
        // Socket connection failed silently
      }
    };

    connectSocket();

    const interval = setInterval(() => {
      if (!socketRef.current?.connected) {
        connectSocket();
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
}
