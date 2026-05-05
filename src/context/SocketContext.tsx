import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  onlineUsers: any[];
  isConnected: boolean;
  incomingChallenge: any | null;
  outgoingChallenge: any | null;
  setIncomingChallenge: (challenge: any | null) => void;
  sendChallenge: (targetUid: string, subjectId: string) => void;
  acceptChallenge: (fromSocketId: string, subjectId: string) => void;
  rejectChallenge: (fromSocketId: string) => void;
  cancelChallenge: (targetSocketId: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  onlineUsers: [],
  isConnected: false,
  incomingChallenge: null,
  outgoingChallenge: null,
  setIncomingChallenge: () => {},
  sendChallenge: () => {},
  acceptChallenge: () => {},
  rejectChallenge: () => {},
  cancelChallenge: () => {},
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [incomingChallenge, setIncomingChallenge] = useState<any | null>(null);
  const [outgoingChallenge, setOutgoingChallenge] = useState<any | null>(null);
  const { profile } = useAuth();

  useEffect(() => {
    const newSocket = io({
      transports: ['polling', 'websocket'],
      upgrade: true
    });
    setSocket(newSocket);

    newSocket.on('connect', () => setIsConnected(true));
    newSocket.on('disconnect', () => setIsConnected(false));

    newSocket.on('users:update', (users) => {
      setOnlineUsers(users);
    });

    newSocket.on('challenge:received', (challenge) => {
      setIncomingChallenge(challenge);
      // Optional: Sound effect or system notification
    });

    newSocket.on('challenge:rejected', () => {
      setOutgoingChallenge(null);
    });

    newSocket.on('challenge:cancelled', () => {
      setIncomingChallenge(null);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const sendChallenge = (targetUid: string, subjectId: string) => {
    socket?.emit('challenge:invite', { targetUid, subjectId });
    // Find target user in online users to store info
    const targetUser = onlineUsers.find(u => u.uid === targetUid);
    if (targetUser) {
      setOutgoingChallenge({ ...targetUser, subjectId });
    }
  };

  const acceptChallenge = (fromSocketId: string, subjectId: string) => {
    socket?.emit('challenge:accept', { fromSocketId, subjectId });
    setIncomingChallenge(null);
  };

  const rejectChallenge = (fromSocketId: string) => {
    socket?.emit('challenge:reject', { fromSocketId });
    setIncomingChallenge(null);
  };

  const cancelChallenge = (targetSocketId: string) => {
    socket?.emit('challenge:cancel', { targetSocketId });
    setOutgoingChallenge(null);
  };

  useEffect(() => {
    if (socket && profile) {
      socket.emit('user:join', {
        uid: profile.uid,
        displayName: profile.displayName,
        photoURL: profile.photoURL,
        role: profile.role
      });
    }
  }, [socket, profile]);

  return (
    <SocketContext.Provider value={{ 
      socket, 
      onlineUsers, 
      isConnected, 
      incomingChallenge,
      outgoingChallenge,
      setIncomingChallenge,
      sendChallenge,
      acceptChallenge,
      rejectChallenge,
      cancelChallenge
    }}>
      {children}
    </SocketContext.Provider>
  );
};
