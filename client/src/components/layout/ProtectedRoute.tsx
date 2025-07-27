import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

/**
 * A component that protects routes meant for authenticated users.
 * If the user is not logged in, it redirects them to the login page.
 */
const ProtectedRoute: React.FC = () => {
  const { user, isLoading } = useAuth();

  // Don't render anything until the auth state is confirmed
  if (isLoading) {
    return null;
  }

  // If there is a user, render the child route. Otherwise, redirect to login.
  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
