import React, { useState, useEffect } from "react";
import api from "@/services/api";
import {
  FileText,
  Bell,
  GraduationCap,
  Bookmark,
  Calendar,
  Users,
  Clock,
  CheckCircle,
} from "lucide-react";

interface TeacherStats {
  totalNotices: number;
  totalAssignments: number;
  totalStudents: number;
  assignedCourses: number;
  activeAssignments: number;
  pendingSubmissions: number;
  upcomingDeadlines: number;
  courseRequests: number;
}

const StatCard: React.FC<{
  title: string;
  value: string;
  icon: React.ElementType;
  description?: string;
}> = ({ title, value, icon: Icon, description }) => (
  <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md flex items-center gap-4">
    <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full">
      <Icon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
    </div>
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {description}
        </p>
      )}
    </div>
  </div>
);

export const TeacherDashboard: React.FC = () => {
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get<TeacherStats>("/teacher/stats");
        // Ensure all properties have default values
        setStats({
          totalNotices: data.totalNotices || 0,
          totalAssignments: data.totalAssignments || 0,
          totalStudents: data.totalStudents || 0,
          assignedCourses: data.assignedCourses || 0,
          activeAssignments: data.activeAssignments || 0,
          pendingSubmissions: data.pendingSubmissions || 0,
          upcomingDeadlines: data.upcomingDeadlines || 0,
          courseRequests: data.courseRequests || 0,
        });
      } catch (error) {
        console.error("Failed to fetch teacher dashboard stats", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-lg">Loading dashboard...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-lg text-red-500">Failed to load dashboard data.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Teacher Dashboard</h1>
      <div className="space-y-8">
        {/* Course Overview */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Course Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              title="Assigned Courses"
              value={stats.assignedCourses.toLocaleString()}
              icon={Bookmark}
            />
            <StatCard
              title="Total Students"
              value={stats.totalStudents.toLocaleString()}
              icon={GraduationCap}
            />
            <StatCard
              title="Course Requests"
              value={stats.courseRequests.toLocaleString()}
              icon={Users}
            />
          </div>
        </div>

        {/* Content Statistics */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Content Statistics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Notices"
              value={stats.totalNotices.toLocaleString()}
              icon={Bell}
            />
            <StatCard
              title="Total Assignments"
              value={stats.totalAssignments.toLocaleString()}
              icon={FileText}
            />
            <StatCard
              title="Active Assignments"
              value={stats.activeAssignments.toLocaleString()}
              description="Currently ongoing"
              icon={Clock}
            />
            <StatCard
              title="Pending Submissions"
              value={stats.pendingSubmissions.toLocaleString()}
              description="Need review"
              icon={CheckCircle}
            />
            <StatCard
              title="Upcoming Deadlines"
              value={stats.upcomingDeadlines.toLocaleString()}
              description="Next 7 days"
              icon={Calendar}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
