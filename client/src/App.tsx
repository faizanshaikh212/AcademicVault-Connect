import { NoticeForm } from "./components/forms/NoticeForm";
import { AssignmentForm } from "./components/forms/AssignmentForm";
import NoticeDetail from "./pages/NoticeDetail";
import AssignmentDetail from "./pages/AssignmentDetail";
import Notices from "./pages/Notices";
import Assignments from "./pages/Assignments";
import { useEffect, useState } from "react";
import { Routes, Route, Outlet } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { useToast } from "./hooks/useToast.tsx";

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
import RequestPremium from "./pages/RequestPremium";
import AdminDashboard from "./pages/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import RoleRequests from "./pages/admin/RoleRequests";
import ContentManagement from "./pages/admin/ContentManagement";
import CourseManagement from "./pages/admin/CourseManagement";
import PremiumRequests from "./pages/admin/PremiumRequests";
import PremiumUsersManagement from "./pages/admin/PremiumUsersManagement";
import CustomerCare from "./pages/admin/CustomerCare";
import NotFound from "./pages/NotFound";
import TermsAndConditions from "./pages/TermsAndConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ContactUs from "./pages/ContactUs";
import NotificationHistory from "./pages/NotificationHistory";
import News from "./pages/News";
import NewsDetail from "./pages/NewsDetail";
import NewsForm from "./pages/admin/NewsForm";
import NewsManagement from "./pages/admin/NewsManagement";
import SubscriberList from "./pages/admin/SubscriberList";
import AboutUs from "./pages/AboutUs";

// Layout Imports
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import AdminRoute from "./components/layout/AdminRoute";
import AdminLayout from "./components/layout/AdminLayout";
import { TeacherRoute } from "./components/shared/TeacherRoute";
import { TeacherLayout } from "./components/layout/TeacherLayout";

import { TeacherDashboard } from "./pages/TeacherDashboard";
import { TeacherCourses } from "./pages/TeacherCourses";
import { TeacherAssignments } from "./pages/TeacherAssignments";
import { TeacherNotices } from "./pages/TeacherNotices";
import { TeacherStudents } from "./pages/TeacherStudents";
import TeacherCourseRequests from "./pages/TeacherCourseRequests";
import StudentManagement from "./pages/StudentManagement";
import { TeacherManagement } from "./pages/admin/TeacherManagement";

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
  // Handlers for form routes
  const handleCreateNotice = async () => {};
  const handleCreateAssignment = async () => {};
  const [courses, setCourses] = useState<
    Array<{
      value: string;
      label: string;
      semesters: number;
    }>
  >([]);
  const { isLoading: authLoading } = useAuth();
  const [pageLoading, setPageLoading] = useState(false);
  const { ToastContainer } = useToast();

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
      <ToastContainer />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<AdminRoute />}>
          <Route path="/admin/*" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="premium-users" element={<PremiumUsersManagement />} />
            <Route path="requests" element={<RoleRequests />} />
            <Route path="premium-requests" element={<PremiumRequests />} />
            <Route path="customer-care" element={<CustomerCare />} />
            <Route path="courses" element={<CourseManagement />} />
            <Route path="teachers" element={<TeacherManagement />} />
            <Route path="content" element={<ContentManagement />} />
            <Route path="news" element={<NewsManagement />} />
            <Route path="news/new" element={<NewsForm />} />
            <Route path="subscribers" element={<SubscriberList />} />
          </Route>
        </Route>
        <Route element={<TeacherRoute />}>
          <Route path="/teacher/*" element={<TeacherLayout />}>
            <Route index element={<TeacherDashboard />} />
            <Route path="courses" element={<TeacherCourses />} />
            <Route path="assignments" element={<TeacherAssignments />} />
            <Route path="notices" element={<TeacherNotices />} />
            <Route path="students" element={<TeacherStudents />} />
            <Route path="student-management" element={<StudentManagement />} />
            <Route path="course-requests" element={<TeacherCourseRequests />} />
            <Route
              path="notices/new"
              element={
                <NoticeForm
                  onSubmit={handleCreateNotice}
                  isSubmitting={false}
                />
              }
            />
            <Route path="notices/:id" element={<NoticeDetail />} />
            <Route
              path="assignments/new"
              element={
                <AssignmentForm
                  onSubmit={handleCreateAssignment}
                  courses={[]} // Removed courses prop as it's handled in TeacherAssignments
                  isLoading={false}
                />
              }
            />
            <Route path="assignments/:id" element={<AssignmentDetail />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute />}></Route>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route path="blogs" element={<Blogs />} />
          <Route path="blogs/:id" element={<BlogDetail />} />
          <Route path="news" element={<News />} />
          <Route path="news/:id" element={<NewsDetail />} />
          <Route path="notices" element={<Notices />} />
          <Route path="notices/:id" element={<NoticeDetail />} />
          <Route path="assignments" element={<Assignments />} />
          <Route path="assignments/:id" element={<AssignmentDetail />} />
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
            <Route path="request-premium" element={<RequestPremium />} />
            <Route
              path="notification-history"
              element={<NotificationHistory />}
            />
          </Route>
          <Route path="/terms" element={<TermsAndConditions />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
