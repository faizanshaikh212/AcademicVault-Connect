import React, { useState, useEffect } from "react";
import api from "@/services/api";
import { User } from "../types";
import UserCard from "@/components/shared/UserCard";
import { Input } from "@/components/ui/Input";
import { Search } from "lucide-react";

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
      } catch (err) {
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
      <div className="text-center py-20 md:py-28 bg-gray-50 dark:bg-gray-900">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
          Our Network
        </h1>
        <p className="mt-4 max-w-3xl mx-auto text-lg text-gray-600 dark:text-gray-400">
          Meet the talented and diverse members of the Academic Vault community.
        </p>
      </div>

      <div className="container mx-auto px-4 py-16">
        {/* Search Bar */}
        <div className="mb-12 max-w-xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by name or username..."
              className="w-full pl-12 h-12 text-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Content Grid */}
        <div>
          {isLoading ? (
            <p className="text-center">Loading our network...</p>
          ) : error ? (
            <p className="text-center text-red-500">{error}</p>
          ) : filteredUsers.length > 0 ? (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filteredUsers.map((user) => (
                <UserCard key={user._id} user={user} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">No users found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default OurNetwork;
