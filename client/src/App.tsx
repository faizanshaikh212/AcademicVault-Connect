import { useEffect, useRef, useState } from "react";
import { Routes, Route, Outlet } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";

// Page Imports
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import ProjectForm from "./pages/ProjectForm";
import Blogs from "./pages/Blogs";
import BlogDetail from "./pages/BlogDetail";
import BlogForm from "./pages/BlogForm";
import OurPurpose from "./pages/OurPurpose";
import OurNetwork from "./pages/OurNetwork";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import RoleRequest from "./pages/RoleRequest";
import AdminDashboard from "./pages/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import RoleRequests from "./pages/admin/RoleRequests";
import AdminContentManager from "./pages/admin/AdminContentManager";
import CustomerCare from "./pages/admin/CustomerCare";
import NotFound from "./pages/NotFound";
import TermsAndConditions from "./pages/TermsAndConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ContactUs from "./pages/ContactUs";

// Layout Imports
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import AdminRoute from "./components/layout/AdminRoute";
import AdminLayout from "./components/layout/AdminLayout";

/**
 * Main application layout with Navbar and Footer.
 */
const MainLayout = () => (
  <div className="flex flex-col min-h-screen bg-white dark:bg-gray-950">
    <Navbar />
    <main className="flex-grow">
      <Outlet />
    </main>
    <Footer />
  </div>
);

function App() {
  const { isLoading: authLoading } = useAuth();
  const audioStarted = useRef(false);
  const [pageLoading, setPageLoading] = useState(false);

  // Add event listeners for page refresh/reload
  useEffect(() => {
    const handleBeforeUnload = () => {
      setPageLoading(true);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    const startAudio = async () => {
      if (window.Tone && !audioStarted.current) {
        try {
          await window.Tone.start();
          console.log("Audio context started successfully.");
          audioStarted.current = true;
        } catch (e) {
          console.error("Could not start audio context", e);
        }
      }
    };
    const handleFirstInteraction = () => {
      startAudio();
      window.removeEventListener("mousedown", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
    };
    window.addEventListener("mousedown", handleFirstInteraction);
    window.addEventListener("keydown", handleFirstInteraction);
    window.addEventListener("touchstart", handleFirstInteraction);
    return () => {
      window.removeEventListener("mousedown", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
    };
  }, []);

  if (authLoading || pageLoading) {
    return (
      <div className="fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-gray-900 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-gray-800 dark:text-gray-200">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<AdminRoute />}>
          <Route path="/admin/*" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="requests" element={<RoleRequests />} />
            <Route path="customer-care" element={<CustomerCare />} />
            <Route path="content" element={<AdminContentManager />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute />}></Route>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route path="blogs" element={<Blogs />} />
          <Route path="blogs/:id" element={<BlogDetail />} />
          <Route path="purpose" element={<OurPurpose />} />
          <Route path="network" element={<OurNetwork />} />
          <Route path="profile/:username" element={<Profile />} />
          <Route element={<ProtectedRoute />}>
            <Route path="projects/new" element={<ProjectForm />} />
            <Route path="projects/edit/:id" element={<ProjectForm />} />
            <Route path="blogs/new" element={<BlogForm />} />
            <Route path="blogs/edit/:id" element={<BlogForm />} />
            <Route path="settings" element={<Settings />} />
            <Route path="request-teacher-role" element={<RoleRequest />} />
          </Route>
          <Route path="/terms" element={<TermsAndConditions />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
