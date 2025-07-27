import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import io, { Socket } from "socket.io-client";
import { useAuth } from "@/hooks/useAuth";

// Define the shape of the context value
interface SocketContextType {
  socket: Socket | null;
  onlineUsers: string[];
}

// Create the context
const SocketContext = createContext<SocketContextType | undefined>(undefined);

// Custom hook to easily access the socket context
export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

/**
 * The SocketProvider component establishes and manages the Socket.IO connection.
 */
export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const { user } = useAuth(); // Get the authenticated user

  useEffect(() => {
    if (user) {
      // If a user is logged in, establish a connection
      const newSocket = io("http://localhost:5001"); // Your backend URL
      setSocket(newSocket);

      // Tell the server who this user is
      newSocket.emit("setup", user);

      // Listen for the list of online users
      newSocket.on("getOnlineUsers", (users) => {
        setOnlineUsers(users);
      });

      // Cleanup function to close the connection when the component unmounts
      return () => {
        newSocket.close();
      };
    } else {
      // If no user is logged in, close any existing socket connection
      if (socket) {
        socket.close();
        setSocket(null);
      }
    }
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};
