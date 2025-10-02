import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { useRole } from "../../contexts/RoleContext";
import {
  BookOpen,
  FileText,
  Clock,
  Users,
  GraduationCap,
  Calendar,
  CheckCircle,
  AlertCircle,
  TrendingUp
} from "lucide-react";

const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const { shouldUseAdminPrivileges } = useRole();

  const [stats, setStats] = useState({
    notesCount: null as number | null,
    coursesCount: null as number | null,
    studentsCount: null as number | null,
    timetablesCount: null as number | null,
    questionPapersCount: null as number | null,
    syllabusCount: null as number | null,
    pendingApprovals: null as number | null,
    noticesCount: null as number | null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [
          notesResponse,
          coursesResponse,
          studentsResponse,
          timetablesResponse,
          questionPapersResponse,
          syllabusResponse,
          noticesResponse
        ] = await Promise.allSettled([
          api.get("/academic/notes").catch(err => {
            console.error("Error fetching notes:", err);
            return { data: { data: [] } };
          }),
          api.get("/courses").catch(err => {
            console.error("Error fetching courses:", err);
            return { data: [] };
          }),
          api.get("/students").catch(err => {
            console.error("Error fetching students:", err);
            return { data: [] };
          }),
          api.get("/academic/timetables").catch(err => {
            console.error("Error fetching timetables:", err);
            return { data: { data: [] } };
          }),
          api.get("/academic/question-papers").catch(err => {
            console.error("Error fetching question papers:", err);
            return { data: { data: [] } };
          }),
          api.get("/academic/syllabus").catch(err => {
            console.error("Error fetching syllabus:", err);
            return { data: { data: [] } };
          }),
          api.get("/notices/all").catch(err => {
            console.error("Error fetching notices:", err);
            return { data: [] };
          })
        ]);

        setStats({
          notesCount: notesResponse.status === 'fulfilled' ? notesResponse.value.data?.data?.length || 0 : 0,
          coursesCount: coursesResponse.status === 'fulfilled' ? coursesResponse.value.data?.length || 0 : 0,
          studentsCount: studentsResponse.status === 'fulfilled' ? studentsResponse.value.data?.length || 0 : 0,
          timetablesCount: timetablesResponse.status === 'fulfilled' ? timetablesResponse.value.data?.data?.length || 0 : 0,
          questionPapersCount: questionPapersResponse.status === 'fulfilled' ? questionPapersResponse.value.data?.data?.length || 0 : 0,
          syllabusCount: syllabusResponse.status === 'fulfilled' ? syllabusResponse.value.data?.data?.length || 0 : 0,
          noticesCount: noticesResponse.status === 'fulfilled' ? noticesResponse.value.data?.length || 0 : 0,
          pendingApprovals: 0 // Will be calculated from the responses above
        });

        // Calculate pending approvals from notes, timetables, etc.
        let pendingCount = 0;
        if (notesResponse.status === 'fulfilled') {
          const notes = notesResponse.value.data?.data || [];
          pendingCount += notes.filter((note: any) => note.status === 'In for Review').length;
        }
        if (timetablesResponse.status === 'fulfilled') {
          const timetables = timetablesResponse.value.data?.data || [];
          pendingCount += timetables.filter((tt: any) => !tt.isApproved).length;
        }
        if (questionPapersResponse.status === 'fulfilled') {
          const papers = questionPapersResponse.value.data?.data || [];
          pendingCount += papers.filter((paper: any) => paper.status === 'In for Review').length;
        }
        if (syllabusResponse.status === 'fulfilled') {
          const syllabus = syllabusResponse.value.data?.data || [];
          pendingCount += syllabus.filter((syl: any) => !syl.isApproved).length;
        }

        setStats(prev => ({ ...prev, pendingApprovals: pendingCount }));
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const StatCard = ({ title, value, icon: Icon, color, description, isLoading = false }: {
    title: string;
    value: number | null;
    icon: any;
    color: string;
    description: string;
    isLoading?: boolean;
  }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        <Icon className={`h-8 w-8 ${color}`} />
      </div>
      <div className="text-center">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className={`text-3xl font-bold ${color} mb-2`}>
              {value !== null ? value.toLocaleString() : '-'}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Teacher Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome back, {user?.firstName} {user?.lastName}!
          {shouldUseAdminPrivileges() && " (Administrator)"}
        </p>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Academic Notes"
          value={stats.notesCount}
          icon={BookOpen}
          color="text-green-600 dark:text-green-400"
          description="Total notes uploaded"
          isLoading={loading}
        />

        <StatCard
          title="Courses"
          value={stats.coursesCount}
          icon={GraduationCap}
          color="text-purple-600 dark:text-purple-400"
          description="Courses managed"
          isLoading={loading}
        />

        <StatCard
          title="Students"
          value={stats.studentsCount}
          icon={Users}
          color="text-orange-600 dark:text-orange-400"
          description="Students enrolled"
          isLoading={loading}
        />

        <StatCard
          title="Notices"
          value={stats.noticesCount}
          icon={AlertCircle}
          color="text-blue-600 dark:text-blue-400"
          description="Notices published"
          isLoading={loading}
        />
      </div>

      {/* Secondary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Timetables"
          value={stats.timetablesCount}
          icon={Clock}
          color="text-red-600 dark:text-red-400"
          description="Timetables uploaded"
          isLoading={loading}
        />

        <StatCard
          title="Question Papers"
          value={stats.questionPapersCount}
          icon={FileText}
          color="text-indigo-600 dark:text-indigo-400"
          description="Question papers available"
          isLoading={loading}
        />

        <StatCard
          title="Syllabus"
          value={stats.syllabusCount}
          icon={Calendar}
          color="text-teal-600 dark:text-teal-400"
          description="Syllabus documents"
          isLoading={loading}
        />

        <StatCard
          title="Pending Approvals"
          value={stats.pendingApprovals}
          icon={AlertCircle}
          color="text-yellow-600 dark:text-yellow-400"
          description="Items awaiting review"
          isLoading={loading}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
          <TrendingUp className="h-6 w-6 text-gray-600 dark:text-gray-400" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors text-left">
            <BookOpen className="h-5 w-5 text-green-600 dark:text-green-400" />
            <div>
              <div className="font-medium text-gray-900 dark:text-white">Upload Academic Notes</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Add study materials</div>
            </div>
          </button>

          <button className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-left">
            <GraduationCap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <div>
              <div className="font-medium text-gray-900 dark:text-white">Manage Courses</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Add or edit courses</div>
            </div>
          </button>

          <button className="flex items-center gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors text-left">
            <Users className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <div>
              <div className="font-medium text-gray-900 dark:text-white">Manage Students</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Assign courses to students</div>
            </div>
          </button>

          <button className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-left">
            <Clock className="h-5 w-5 text-red-600 dark:text-red-400" />
            <div>
              <div className="font-medium text-gray-900 dark:text-white">Upload Timetable</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Add class schedules</div>
            </div>
          </button>

          <button className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-left">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <div>
              <div className="font-medium text-gray-900 dark:text-white">Create Notice</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Announce to students</div>
            </div>
          </button>

          <button className="flex items-center gap-3 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors text-left">
            <CheckCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <div className="font-medium text-gray-900 dark:text-white">Review Submissions</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Approve pending content</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
