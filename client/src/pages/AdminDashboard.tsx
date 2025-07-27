import React, { useState, useEffect } from "react";
import api from "@/services/api";
import { Users, FileText, CheckSquare } from "lucide-react";

interface Stats {
  totalUsers: number;
  totalProjects: number;
  pendingRequests: number;
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

  if (isLoading) return <p className="text-center">Loading dashboard...</p>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers.toLocaleString() ?? "0"}
          icon={Users}
        />
        <StatCard
          title="Total Projects"
          value={stats?.totalProjects.toLocaleString() ?? "0"}
          icon={FileText}
        />
        <StatCard
          title="Pending Role Requests"
          value={stats?.pendingRequests.toLocaleString() ?? "0"}
          icon={CheckSquare}
        />
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md">
          <p className="text-gray-500">Activity feed will be displayed here.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
