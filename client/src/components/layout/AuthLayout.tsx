import React, { ReactNode } from "react";

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
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-gray-900">
      {/* Animated Galaxy Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-transparent bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute inset-0 bg-transparent bg-[radial-gradient(circle_500px_at_50%_200px,#3e3e3e,transparent)]"></div>
      </div>

      {/* Form Card */}
      <div className="relative z-10 w-full max-w-md rounded-xl border border-white/10 bg-gray-900/50 p-8 shadow-2xl backdrop-blur-lg">
        <h1 className="relative mb-6 text-center text-3xl font-bold text-white">
          {title}
        </h1>
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
