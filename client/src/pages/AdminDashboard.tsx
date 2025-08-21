import React, { useState, useEffect } from "react";
import api from "@/services/api";
import {
  Users,
  FileText,
  CheckSquare,
  Crown,
  GraduationCap,
  CreditCard,
  BookOpen,
  Mail,
} from "lucide-react";

interface Stats {
  totalUsers: number;
  totalProjects: number;
  totalBlogs: number;
  totalNews: number;
  pendingRoleRequests: number;
  pendingPremiumRequests: number;
  premiumUsers: number;
  teacherUsers: number;
}

const StatCard: React.FC<{
  title: string;
  value: string;
  icon: React.ElementType;
}> = ({ title, value, icon: Icon }) => (
  <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md flex items-center gap-4">
    <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full">
      <Icon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
    </div>
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  </div>
);

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get<Stats>("/admin/stats");
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
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
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="space-y-8">
        {/* User Statistics */}
        <div>
          <h2 className="text-xl font-semibold mb-4">User Statistics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              title="Total Users"
              value={stats.totalUsers.toLocaleString()}
              icon={Users}
            />
            <StatCard
              title="Premium Users"
              value={stats.premiumUsers.toLocaleString()}
              icon={Crown}
            />
            <StatCard
              title="Teacher Users"
              value={stats.teacherUsers.toLocaleString()}
              icon={GraduationCap}
            />
          </div>
        </div>

        {/* Content & Requests */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Content & Requests</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Projects"
              value={stats.totalProjects.toLocaleString()}
              icon={FileText}
            />
            <StatCard
              title="Total Blogs"
              value={stats.totalBlogs.toLocaleString()}
              icon={BookOpen}
            />
            <StatCard
              title="Pending Role Requests"
              value={stats.pendingRoleRequests.toLocaleString()}
              icon={CheckSquare}
            />
            <StatCard
              title="Pending Premium Requests"
              value={stats.pendingPremiumRequests.toLocaleString()}
              icon={CreditCard}
            />
            <StatCard
              title="Total News"
              value={stats.totalNews.toLocaleString()}
              icon={Mail}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
