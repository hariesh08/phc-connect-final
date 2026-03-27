import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Landing from "./pages/Landing";
import SelectRole from "./pages/SelectRole";
import Login from "./pages/Login";
import PublicFeedback from "./pages/PublicFeedback";
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import PhcDashboard from "./pages/phc/PhcDashboard";
import DdhsDashboard from "./pages/ddhs/DdhsDashboard";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/select-role" element={<SelectRole />} />
          <Route path="/login" element={<Login />} />
          <Route path="/public-feedback" element={<PublicFeedback />} />
          <Route path="/doctor/*" element={<DoctorDashboard />} />
          <Route path="/phc/*" element={<PhcDashboard />} />
          <Route path="/ddhs/*" element={<DdhsDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
