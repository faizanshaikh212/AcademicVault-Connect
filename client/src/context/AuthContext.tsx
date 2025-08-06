import React, { createContext, useState, useEffect, ReactNode } from "react";
import { AuthContextType, AuthState, User } from "@/types";

// Create the context with a default value
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * The AuthProvider component is responsible for managing the authentication state
 * and providing it to the rest of the application.
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // On initial load, check localStorage for existing session data
    try {
      const storedUser = localStorage.getItem("user");
      const storedToken = localStorage.getItem("token");

      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      }
    } catch (error) {
      console.error("Failed to parse auth data from localStorage", error);
      // Clear potentially corrupted data
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    } finally {
      setIsLoading(false); // Stop loading once checked
    }
  }, []);

  // Function to handle user login
  const login = (data: AuthState) => {
    if (data.user && data.token) {
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);
    }
  };

  // Function to handle user logout
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  // Function to update the user's profile
  const updateProfile = (profile: Partial<User["profile"]>) => {
    if (user) {
      const updatedUser = {
        ...user,
        profile: { ...user.profile, ...profile },
        updatedAt: new Date().toISOString(), // Update the timestamp
      };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    }
  };

  const value = {
    user,
    token,
    login,
    logout,
    isLoading,
    updateProfile,
  };

  // Provide the context value to child components
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
