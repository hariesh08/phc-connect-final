import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, Role } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { session, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500 mb-4" />
        <p className="text-gray-500 font-medium animate-pulse">Checking credentials...</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If roles are specified, check if the user has the required role
  if (allowedRoles && allowedRoles.length > 0) {
    if (!profile || !profile.role || !allowedRoles.includes(profile.role)) {
      return <Navigate to="/login" replace />;
    }

    // Approval status check (DDHS admin bypasses — always approved)
    if (profile.role !== "ddhs_admin") {
      if (profile.status === "pending") {
        return <Navigate to="/approval-pending" replace />;
      }
      if (profile.status === "rejected") {
        return <Navigate to="/approval-rejected" replace />;
      }
    }
  }

  return <>{children}</>;
};
