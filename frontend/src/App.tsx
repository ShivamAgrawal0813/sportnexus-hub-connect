import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import LandingPage from "./pages/landing";
import NotFound from "./pages/NotFound";
import { lazy, Suspense } from "react";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

// Lazy load pages for code splitting
const Venues = lazy(() => import("./pages/venues"));
const VenueDetail = lazy(() => import("./pages/venues/DetailPage"));
const Equipment = lazy(() => import("./pages/equipment"));
const EquipmentDetail = lazy(() => import("./pages/equipment/DetailPage"));
const Tutorials = lazy(() => import("./pages/tutorials"));
const TutorialDetail = lazy(() => import("./pages/tutorials/DetailPage"));
const Bookings = lazy(() => import("./pages/bookings"));
const BookingCheckout = lazy(() => import("./pages/bookings/CheckoutPage"));
const Profile = lazy(() => import("./pages/profile"));
const PaymentSettings = lazy(() => import("./pages/profile/PaymentSettings"));
const Login = lazy(() => import("./pages/auth/login"));
const Register = lazy(() => import("./pages/auth/register"));
const AdminDashboard = lazy(() => import("./pages/admin/Index"));
const AdminMyBookings = lazy(() => import("./pages/admin/MyBookings"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));
const AdminAddTutorial = lazy(() => import("./pages/admin/AddTutorial"));
const AdminEditTutorial = lazy(() => import("./pages/admin/EditTutorial"));
const AdminDiscountManager = lazy(() => import("./pages/admin/DiscountManager"));

// Create a loading component
const PageLoading = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

const queryClient = new QueryClient();

const AppRoutes = () => (
  <Routes>
    {/* Public routes */}
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={
      <Suspense fallback={<PageLoading />}>
        <Login />
      </Suspense>
    } />
    <Route path="/register" element={
      <Suspense fallback={<PageLoading />}>
        <Register />
      </Suspense>
    } />
    
    {/* Protected routes inside MainLayout */}
    <Route element={<ProtectedRoute />}>
      <Route element={<MainLayout />}>
        <Route path="venues" element={
          <Suspense fallback={<PageLoading />}>
            <Venues />
          </Suspense>
        } />
        <Route path="venues/:id" element={
          <Suspense fallback={<PageLoading />}>
            <VenueDetail />
          </Suspense>
        } />
        <Route path="equipment" element={
          <Suspense fallback={<PageLoading />}>
            <Equipment />
          </Suspense>
        } />
        <Route path="equipment/:id" element={
          <Suspense fallback={<PageLoading />}>
            <EquipmentDetail />
          </Suspense>
        } />
        <Route path="tutorials" element={
          <Suspense fallback={<PageLoading />}>
            <Tutorials />
          </Suspense>
        } />
        <Route path="tutorials/:id" element={
          <Suspense fallback={<PageLoading />}>
            <TutorialDetail />
          </Suspense>
        } />
        <Route path="bookings" element={
          <Suspense fallback={<PageLoading />}>
            <Bookings />
          </Suspense>
        } />
        <Route path="bookings/checkout/:bookingId" element={
          <Suspense fallback={<PageLoading />}>
            <BookingCheckout />
          </Suspense>
        } />
        <Route path="profile" element={
          <Suspense fallback={<PageLoading />}>
            <Profile />
          </Suspense>
        } />
        <Route path="payment-settings" element={
          <Suspense fallback={<PageLoading />}>
            <PaymentSettings />
          </Suspense>
        } />
      </Route>
    </Route>
    
    {/* Admin routes */}
    <Route element={<ProtectedRoute requireAdmin={true} />}>
      <Route element={<MainLayout />}>
        <Route path="admin" element={
          <Suspense fallback={<PageLoading />}>
            <AdminDashboard />
          </Suspense>
        } />
        <Route path="admin/my-bookings" element={
          <Suspense fallback={<PageLoading />}>
            <AdminMyBookings />
          </Suspense>
        } />
        <Route path="admin/settings" element={
          <Suspense fallback={<PageLoading />}>
            <AdminSettings />
          </Suspense>
        } />
        <Route path="admin/add-tutorial" element={
          <Suspense fallback={<PageLoading />}>
            <AdminAddTutorial />
          </Suspense>
        } />
        <Route path="admin/edit-tutorial/:id" element={
          <Suspense fallback={<PageLoading />}>
            <AdminEditTutorial />
          </Suspense>
        } />
        <Route path="admin/discounts" element={
          <Suspense fallback={<PageLoading />}>
            <AdminDiscountManager />
          </Suspense>
        } />
      </Route>
    </Route>
    
    {/* Catch-all route */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
