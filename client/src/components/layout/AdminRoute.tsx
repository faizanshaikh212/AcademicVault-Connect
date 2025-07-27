import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const AdminRoute: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  // THE FIX: Check if the user's role array includes 'admin'
  if (user && user.role.includes("admin")) {
    return <Outlet />;
  }

  return <Navigate to="/" replace />;
};

export default AdminRoute;
