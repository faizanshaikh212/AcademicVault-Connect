import React, { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/contexts/RoleContext";
import { logRoleCheck } from "@/utils/roleDebug";

const TeacherRoute: React.FC = () => {
  const { user, isLoading } = useAuth();
  const { hasRole, shouldUseTeacherPrivileges } = useRole();
  const location = useLocation();

  const hasTeacherAccess = user && shouldUseTeacherPrivileges();

  useEffect(() => {
    if (user && !isLoading) {
      logRoleCheck(
        `TeacherRoute - ${location.pathname}`,
        user.role || [],
        'teacher',
        hasTeacherAccess || false,
        {
          userId: user._id,
          username: user.username,
          pathname: location.pathname
        }
      );
    }
  }, [user, isLoading, hasTeacherAccess, location.pathname]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-gray-900 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user exists
  if (!user) {
    if (import.meta.env.DEV) {
      console.warn('TeacherRoute: No user found, redirecting to login');
    }
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Check if user has teacher privileges (teacher or admin role)
  if (!hasTeacherAccess) {
    if (import.meta.env.DEV) {
      console.warn('TeacherRoute: User lacks teacher privileges', {
        userRoles: user.role,
        hasTeacherRole: hasRole('teacher'),
        hasAdminRole: hasRole('admin'),
        shouldUseTeacherPrivileges: shouldUseTeacherPrivileges()
      });
    }

    // Show access denied page instead of redirecting to login
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
          <div className="mb-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900">
              <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Access Denied
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            You need teacher privileges to access this area. If you are an educator, please request teacher role access.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => window.history.back()}
              className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
            >
              Go Back
            </button>
            <Navigate to="/request-teacher-role" replace />
          </div>
          {import.meta.env.DEV && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900 rounded-md text-left">
              <p className="text-xs text-yellow-800 dark:text-yellow-200 font-mono">
                Debug: User roles: {JSON.stringify(user.role)}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return <Outlet />;
};

export default TeacherRoute;
