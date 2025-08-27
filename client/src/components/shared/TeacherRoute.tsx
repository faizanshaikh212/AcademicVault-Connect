import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { LoadingSpinner } from "../ui/LoadingSpinner";

interface TeacherRouteProps {
  redirectPath?: string;
}

export const TeacherRoute: React.FC<TeacherRouteProps> = ({
  redirectPath = "/login",
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <Navigate to={redirectPath} replace state={{ from: location.pathname }} />
    );
  }

  if (!user.role.includes("teacher")) {
    return (
      <Navigate
        to="/unauthorized"
        replace
        state={{
          message: "You must be a teacher to access this area",
          requiredRole: "teacher",
          from: location.pathname,
        }}
      />
    );
  }

  return <Outlet />;
};
