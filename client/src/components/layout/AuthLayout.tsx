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
      <main className="relative z-10 flex min-h-[100svh] items-center justify-center bg-gradient-to-br from-slate-950 via-gray-900 to-blue-950 px-4 pb-8 pt-24">
        {/* Form Card */}
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-gray-900/70 p-5 shadow-2xl shadow-black/20 backdrop-blur-lg sm:p-8">
          <h1 className="relative mb-6 text-center text-3xl font-bold text-white">
            {title}
          </h1>
          {children}
        </div>
      </main>
    </>
  );
};

export default AuthLayout;
