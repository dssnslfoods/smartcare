import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index.tsx";
import MasterData from "./pages/MasterData.tsx";
import ComplaintForm from "./pages/ComplaintForm.tsx";
import ComplaintList from "./pages/ComplaintList.tsx";
import Login from "./pages/Login.tsx";
import NotFound from "./pages/NotFound.tsx";
import UserManagement from "./pages/UserManagement.tsx";
import RolePermissions from "./pages/RolePermissions.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute resource="dashboard"><Index /></ProtectedRoute>} />
            <Route path="/master-data" element={<ProtectedRoute resource="master_data"><MasterData /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute resource="user_management"><UserManagement /></ProtectedRoute>} />
            <Route path="/permissions" element={<ProtectedRoute resource="role_permissions"><RolePermissions /></ProtectedRoute>} />
            <Route path="/complaints" element={<ProtectedRoute resource="complaint_list"><ComplaintList /></ProtectedRoute>} />
            <Route path="/complaints/new" element={<ProtectedRoute resource="complaint_form"><ComplaintForm /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
