import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

// Public Pages
import Index from "./pages/Index";
import Properties from "./pages/Properties";
import PropertyDetails from "./pages/PropertyDetails";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Pricing from "./pages/Pricing";
import Advertise from "./pages/Advertise";
import NotFound from "./pages/NotFound";

// Dashboard Pages
import Dashboard from "./pages/dashboard/Dashboard";
import MyProperties from "./pages/dashboard/MyProperties";
import NewProperty from "./pages/dashboard/NewProperty";
import BuyCredits from "./pages/dashboard/BuyCredits";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminProperties from "./pages/admin/AdminProperties";
import AdminKeywords from "./pages/admin/AdminKeywords";
import AdminAds from "./pages/admin/AdminAds";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminPackages from "./pages/admin/AdminPackages";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Index />} />
            <Route path="/properties" element={<Properties />} />
            <Route path="/properties/:id" element={<PropertyDetails />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/advertise" element={<Advertise />} />

            {/* User Dashboard */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard/properties" element={<ProtectedRoute><MyProperties /></ProtectedRoute>} />
            <Route path="/dashboard/properties/new" element={<ProtectedRoute><NewProperty /></ProtectedRoute>} />
            <Route path="/dashboard/credits" element={<ProtectedRoute><BuyCredits /></ProtectedRoute>} />

            {/* Admin */}
            <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute adminOnly><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/properties" element={<ProtectedRoute adminOnly><AdminProperties /></ProtectedRoute>} />
            <Route path="/admin/keywords" element={<ProtectedRoute adminOnly><AdminKeywords /></ProtectedRoute>} />
            <Route path="/admin/ads" element={<ProtectedRoute adminOnly><AdminAds /></ProtectedRoute>} />
            <Route path="/admin/analytics" element={<ProtectedRoute adminOnly><AdminAnalytics /></ProtectedRoute>} />
            <Route path="/admin/credit-packages" element={<ProtectedRoute adminOnly><AdminPackages /></ProtectedRoute>} />
            <Route path="/admin/extra-packages" element={<ProtectedRoute adminOnly><AdminPackages /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
