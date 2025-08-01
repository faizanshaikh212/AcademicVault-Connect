import React, { useState, useEffect } from "react";
import api from "@/services/api";
import { User } from "../../types";
import { Button } from "@/components/ui/Button";

const availableRoles: User["role"] = ["student", "teacher", "admin"];

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    role: ["student"],
  });
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await api.get("/admin/users");
        setUsers(data);
      } catch (err) {
        setError("Failed to fetch users.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleRoleChange = (
    userId: string,
    role: string,
    isChecked: boolean
  ) => {
    setUsers(
      users.map((user) => {
        if (user._id === userId) {
          const newRoles = isChecked
            ? [...user.role, role] // Add role
            : user.role.filter((r) => r !== role); // Remove role
          return { ...user, role: newRoles };
        }
        return user;
      })
    );
  };

  const handleSaveChanges = async (userId: string) => {
    const user = users.find((u) => u._id === userId);
    if (!user) return;

    try {
      await api.put(`/admin/users/${userId}/role`, { roles: user.role });
      // Optionally show a success message
      alert(`Roles for ${user.username} updated successfully!`);
    } catch (error) {
      alert("Failed to update user roles.");
      // Optionally revert changes on failure
    }
  };

  const handleNewUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewUser({ ...newUser, [e.target.name]: e.target.value });
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateMsg(null);
    try {
      await api.post("/auth/register", newUser);
      setCreateMsg("User created successfully!");
      setNewUser({
        firstName: "",
        lastName: "",
        username: "",
        email: "",
        password: "",
        role: ["student"],
      });
    } catch (err: any) {
      setCreateMsg(err.response?.data?.message || "Failed to create user.");
    } finally {
      setCreating(false);
    }
  };

  if (isLoading) return <p className="text-center">Loading users...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">User Management</h1>
      <div className="mb-8 bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Create New User</h2>
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input
              name="firstName"
              value={newUser.firstName}
              onChange={handleNewUserChange}
              placeholder="First Name"
              className="border rounded px-3 py-2"
              required
            />
            <input
              name="lastName"
              value={newUser.lastName}
              onChange={handleNewUserChange}
              placeholder="Last Name"
              className="border rounded px-3 py-2"
              required
            />
            <input
              name="username"
              value={newUser.username}
              onChange={handleNewUserChange}
              placeholder="Username"
              className="border rounded px-3 py-2"
              required
            />
            <input
              name="email"
              value={newUser.email}
              onChange={handleNewUserChange}
              placeholder="Email"
              className="border rounded px-3 py-2"
              required
            />
            <input
              name="password"
              type="password"
              value={newUser.password}
              onChange={handleNewUserChange}
              placeholder="Password"
              className="border rounded px-3 py-2"
              required
            />
          </div>
          <Button type="submit" disabled={creating} className="w-full">
            {creating ? "Creating..." : "Create User"}
          </Button>
          {createMsg && (
            <div
              className={
                createMsg.includes("success")
                  ? "text-green-600 mt-2"
                  : "text-red-600 mt-2"
              }
            >
              {createMsg}
            </div>
          )}
        </form>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800 dark:text-gray-400">
            <tr>
              <th scope="col" className="px-6 py-3">
                Username
              </th>
              <th scope="col" className="px-6 py-3">
                Email
              </th>
              <th scope="col" className="px-6 py-3">
                Roles
              </th>
              <th scope="col" className="px-6 py-3">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user._id}
                className="bg-white border-b dark:bg-gray-900 dark:border-gray-800"
              >
                <th
                  scope="row"
                  className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                >
                  {user.username}
                </th>
                <td className="px-6 py-4">{user.email}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {availableRoles.map((role) => (
                      <label
                        key={role}
                        className="flex items-center gap-1 capitalize"
                      >
                        <input
                          type="checkbox"
                          checked={user.role.includes(role)}
                          onChange={(e) =>
                            handleRoleChange(user._id, role, e.target.checked)
                          }
                          className="rounded"
                        />
                        {role}
                      </label>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Button size="sm" onClick={() => handleSaveChanges(user._id)}>
                    Save
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
