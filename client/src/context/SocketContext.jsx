import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
      setOnlineUsers([]);
      return;
    }

    const defaultSocketUrl =
      typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
        ? 'https://connectify-9s4e.onrender.com'
        : window.location.origin;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || defaultSocketUrl;

    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('[Socket.IO] Connected successfully with ID:', newSocket.id);
    });

    newSocket.on('online_users_list', (users) => {
      setOnlineUsers(users || []);
    });

    newSocket.on('user_online', ({ userId }) => {
      setOnlineUsers((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
    });

    newSocket.on('user_offline', ({ userId }) => {
      setOnlineUsers((prev) => prev.filter((id) => id !== userId));
    });

    newSocket.on('connect_error', (err) => {
      console.warn('[Socket.IO Connect Error]', err.message);
    });

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [token, user?._id]);

  const isUserOnline = (userId) => {
    if (!userId) return false;
    const id = typeof userId === 'object' ? userId._id : userId;
    return onlineUsers.includes(id?.toString());
  };

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, isUserOnline }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
