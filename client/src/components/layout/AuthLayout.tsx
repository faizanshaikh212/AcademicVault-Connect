import React, { ReactNode } from "react";
import Navbar from "./Navbar";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
}

/**
 * A layout for authentication pages (Login, Register).
 * Provides a consistent background and centered form container.
 */
const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title }) => {
  return (
    <>
      <Navbar />
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900 pt-30">
        {/* Form Card */}
        <div className="relative z-10 w-full max-w-md rounded-xl border border-white/10 bg-gray-900/50 p-8 shadow-2xl backdrop-blur-lg">
          <h1 className="relative mb-6 text-center text-3xl font-bold text-white">
            {title}
          </h1>
          {children}
        </div>
      </div>
    </>
  );
};

export default AuthLayout;
