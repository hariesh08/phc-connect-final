import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Landing from "./pages/Landing";
import SelectRole from "./pages/SelectRole";
import Login from "./pages/Login";
import PublicFeedback from "./pages/PublicFeedback";
import ApprovalPending from "./pages/ApprovalPending";
import ApprovalRejected from "./pages/ApprovalRejected";
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import PhcDashboard from "./pages/phc/PhcDashboard";
import DdhsDashboard from "./pages/ddhs/DdhsDashboard";
import NotFound from "./pages/NotFound.tsx";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { supabase } from "@/lib/supabase";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/select-role" element={<SelectRole />} />
              <Route path="/login" element={<Login />} />
              <Route path="/public-feedback" element={<PublicFeedback />} />
              <Route path="/approval-pending" element={<ApprovalPending />} />
              <Route path="/approval-rejected" element={<ApprovalRejected />} />
              <Route 
                path="/doctor/*" 
                element={
                  <ProtectedRoute allowedRoles={["doctor"]}>
                    <DoctorDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/phc/*" 
                element={
                  <ProtectedRoute allowedRoles={["phc_admin"]}>
                    <PhcDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/ddhs/*" 
                element={
                  <ProtectedRoute allowedRoles={["ddhs_admin"]}>
                    <DdhsDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
