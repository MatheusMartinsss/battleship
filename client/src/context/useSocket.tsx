import React, { ReactNode, createContext, useContext } from 'react';
import { io, Socket } from 'socket.io-client';

const URL = 'http://localhost:3000/';
const SocketContext = createContext<{ socket: Socket } | null>(null);

interface SocketProviderProps {
    children: ReactNode;
}

export const SocketProvider = ({ children }: SocketProviderProps) => {
    const socket = io(URL);
    return (
        <SocketContext.Provider value= {{ socket }}>
    { children }
    </SocketContext.Provider>
    );
};

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};