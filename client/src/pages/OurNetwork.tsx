import React, { useState, useEffect } from "react";
import api from "@/services/api";
import { User } from "../types";
import UserCard from "@/components/shared/UserCard";
import { Input } from "@/components/ui/Input";
import { Search } from "lucide-react";
import NewsletterSubscribe from "@/components/shared/NewsletterSubscribe";

const OurNetwork: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // This endpoint already returns only public users from the backend
        const { data } = await api.get<User[]>("/users/all");
        setUsers(data);
        setFilteredUsers(data);
      } catch {
        setError("Failed to fetch our network. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    const results = users.filter(
      (user) =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${user.firstName} ${user.lastName}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(results);
  }, [searchTerm, users]);

  return (
    <div className="bg-white dark:bg-gray-950">
      <header className="bg-white px-5 pb-12 pt-32 dark:bg-gray-900 md:px-8 md:pb-16">
        <div className="relative mx-auto w-full max-w-[120rem]">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
            The people behind the resources
          </p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-5xl">
            Our Network
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600 dark:text-gray-400">
            Meet students and teachers sharing academic resources, projects,
            and ideas.
          </p>
        </div>
      </header>

      <div className="container mx-auto w-full max-w-[120rem] px-5 py-10 md:px-8 md:py-14">
        <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-bold text-slate-950 dark:text-white">
              Community members
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-gray-400">
              Search by name or username.
            </p>
          </div>
          <div className="w-full sm:max-w-md">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by name or username..."
                className="h-12 w-full border-slate-300 bg-transparent pl-12 text-base dark:border-gray-700"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div>
          {isLoading ? (
            <p className="text-center">Loading our network...</p>
          ) : error ? (
            <p className="text-center text-red-500">{error}</p>
          ) : filteredUsers.length > 0 ? (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredUsers.map((user) => (
                <UserCard key={user._id} user={user} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">No users found.</p>
          )}
        </div>
        <div className="mt-16">
          <NewsletterSubscribe />
        </div>
      </div>
    </div>
  );
};

export default OurNetwork;
