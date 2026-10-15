import { lazy, Suspense } from "react";
import { Routes, Route, Outlet } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { RoleProvider } from "./contexts/RoleContext";

import CookieBanner from "./components/layout/CookieBanner";
import CookieSettingsModal from "./components/layout/CookieSettingsModal";
import EmailVerificationBanner from "./components/auth/EmailVerificationBanner";
import Home from "./pages/Home";
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const PasswordResetForm = lazy(() => import("./components/auth/PasswordResetForm"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const Projects = lazy(() => import("./pages/Projects"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const ProjectForm = lazy(() => import("./pages/ProjectForm"));
const Blogs = lazy(() => import("./pages/Blogs"));
const BlogDetail = lazy(() => import("./pages/BlogDetail"));
const BlogForm = lazy(() => import("./pages/BlogForm"));
const OurPurpose = lazy(() => import("./pages/OurPurpose"));
const OurNetwork = lazy(() => import("./pages/OurNetwork"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const SessionsPage = lazy(() => import("./pages/Settings/Sessions"));
const SecurityPage = lazy(() => import("./pages/Settings/Security"));
const RoleRequest = lazy(() => import("./pages/RoleRequest"));
const RequestPremium = lazy(() => import("./pages/RequestPremium"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement"));
const RoleRequests = lazy(() => import("./pages/admin/RoleRequests"));
const ContentManagement = lazy(() => import("./pages/admin/ContentManagement"));
const PremiumRequests = lazy(() => import("./pages/admin/PremiumRequests"));
const PremiumUsersManagement = lazy(() => import("./pages/admin/PremiumUsersManagement"));
const CustomerCare = lazy(() => import("./pages/admin/CustomerCare"));
const NotFound = lazy(() => import("./pages/NotFound"));
const TermsAndConditions = lazy(() => import("./pages/TermsAndConditions"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const ContactUs = lazy(() => import("./pages/ContactUs"));
const NotificationHistory = lazy(() => import("./pages/NotificationHistory"));
const News = lazy(() => import("./pages/News"));
const NewsDetail = lazy(() => import("./pages/NewsDetail"));
const NoticesPage = lazy(() => import("./pages/Notices"));
const NoticeDetail = lazy(() => import("./pages/NoticeDetail"));
const NewsForm = lazy(() => import("./pages/admin/NewsForm"));
const NewsManagement = lazy(() => import("./pages/admin/NewsManagement"));
const NoticeManagement = lazy(() => import("./pages/admin/NoticeManagement"));
const SubscriberList = lazy(() => import("./pages/admin/SubscriberList"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const AcademicNotes = lazy(() => import("./pages/AcademicNotes"));
const QuestionPapers = lazy(() => import("./pages/QuestionPapersTable"));
const Syllabus = lazy(() => import("./pages/Syllabus"));
const Timetables = lazy(() => import("./pages/Timetables"));

// Layout Imports
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import AdminRoute from "./components/layout/AdminRoute";
import AdminLayout from "./components/layout/AdminLayout";
import TeacherRoute from "./components/layout/TeacherRoute";
import TeacherLayout from "./components/layout/TeacherLayout";
const TeacherNoticesManagement = lazy(() => import("./pages/teacher/NoticesManagement"));
const TeacherDashboard = lazy(() => import("./pages/teacher/Dashboard"));
const TeacherNotesManagement = lazy(() => import("./pages/teacher/NotesManagement"));
const TeacherQuestionPapersManagement = lazy(() => import("./pages/teacher/QuestionPapersManagement"));
const TeacherSyllabusManagement = lazy(() => import("./pages/teacher/SyllabusManagement"));
const TeacherTimetablesManagement = lazy(() => import("./pages/teacher/TimetablesManagement"));
const TeacherCourseManagement = lazy(() => import("./pages/teacher/CourseManagement"));
const TeacherStudentManagement = lazy(() => import("./pages/teacher/StudentManagement"));

/**
 * Main application layout with Navbar and Footer.
 */
const MainLayout = () => (
  <div className="flex min-h-screen flex-col bg-white dark:bg-gray-900">
    <Navbar />
    <EmailVerificationBanner />
    <main className="app-main min-w-0 w-full flex-grow">
      <Outlet />
    </main>
    <Footer />
  </div>
);

function App() {
  const { isLoading: authLoading } = useAuth();

  if (authLoading) {
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
    <RoleProvider>
      <div className="text-gray-800 dark:text-gray-200">
        <CookieBanner />
        <CookieSettingsModal />
        <Suspense
          fallback={
            <div
              role="status"
              className="flex min-h-[50vh] items-center justify-center text-sm text-slate-600 dark:text-gray-300"
            >
              Loading page…
            </div>
          }
        >
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<PasswordResetForm />} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />
          <Route element={<AdminRoute />}>
            <Route path="/admin/*" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="premium-users" element={<PremiumUsersManagement />} />
              <Route path="requests" element={<RoleRequests />} />
              <Route path="premium-requests" element={<PremiumRequests />} />
              <Route path="customer-care" element={<CustomerCare />} />
              <Route path="content" element={<ContentManagement />} />
              <Route path="news" element={<NewsManagement />} />
              <Route path="news/new" element={<NewsForm />} />
              <Route path="notices" element={<NoticeManagement />} />
              <Route path="notices/new" element={<NewsForm />} />
              <Route path="subscribers" element={<SubscriberList />} />
            </Route>
          </Route>
          {/* Teacher Panel Routes */}
          <Route element={<TeacherRoute />}>
            <Route path="/teacher/*" element={<TeacherLayout />}>
              <Route index element={<TeacherDashboard />} />
              <Route path="notices" element={<TeacherNoticesManagement />} />
              <Route path="notes" element={<TeacherNotesManagement />} />
              <Route
                path="question-papers"
                element={<TeacherQuestionPapersManagement />}
              />
              <Route path="syllabus" element={<TeacherSyllabusManagement />} />
              <Route
                path="timetables"
                element={<TeacherTimetablesManagement />}
              />
              <Route path="courses" element={<TeacherCourseManagement />} />
              <Route path="students" element={<TeacherStudentManagement />} />
            </Route>
          </Route>

          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/:id" element={<ProjectDetail />} />
            <Route path="blogs" element={<Blogs />} />
            <Route path="blogs/:id" element={<BlogDetail />} />
            <Route path="news" element={<News />} />
            <Route path="news/:id" element={<NewsDetail />} />
            <Route path="notices" element={<NoticesPage />} />
            <Route path="notices/:id" element={<NoticeDetail />} />
            <Route path="purpose" element={<OurPurpose />} />
            <Route path="network" element={<OurNetwork />} />

            {/* Academic Resources Routes */}
            <Route path="academic/notes" element={<AcademicNotes />} />
            <Route path="academic/question-papers" element={<QuestionPapers />} />
            <Route path="academic/syllabus" element={<Syllabus />} />
            <Route path="academic/timetables" element={<Timetables />} />


            <Route path="profile/:username" element={<Profile />} />
            <Route element={<ProtectedRoute />}>
              <Route path="projects/new" element={<ProjectForm />} />
              <Route path="projects/edit/:id" element={<ProjectForm />} />
              <Route path="blogs/new" element={<BlogForm />} />
              <Route path="blogs/edit/:id" element={<BlogForm />} />
              <Route path="settings" element={<Settings />} />
              <Route path="settings/sessions" element={<SessionsPage />} />
              <Route path="settings/security" element={<SecurityPage />} />
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
        </Suspense>
      </div>
    </RoleProvider>
  );
}

export default App;
