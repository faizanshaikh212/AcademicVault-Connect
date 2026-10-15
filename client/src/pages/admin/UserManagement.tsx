import { useState, useEffect } from "react";
import api from "@/services/api";
import { User } from "@/types";
import EnhancedSearchBar from "@/components/shared/EnhancedSearchBar";
import PasswordConfirmDialog from "@/components/shared/PasswordConfirmDialog";
import { Input } from "@/components/ui/Input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { ExternalLink, Trash2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/useToast";

const availableRoles = ["student", "teacher", "admin"];

interface UserDataWithPassword extends Partial<User> {
  password?: string;
}

interface EditUserDialogProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: UserDataWithPassword) => Promise<void>;
}

const EditUserDialog: React.FC<EditUserDialogProps> = ({
  user,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<User>>({});
  const [saving, setSaving] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        role: user.role,
        premium: user.premium,
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.username ||
      !formData.email
    ) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Validate password for new users
    if (!user && !password) {
      toast({
        title: "Error",
        description: "Password is required for new users",
        variant: "destructive",
      });
      return;
    }

    // Validate roles
    if (!formData.role || formData.role.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one role",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      await onSave(!user ? { ...formData, password } : formData);

      // Reset form on successful save
      if (!user) {
        setFormData({});
        setPassword("");
        setShowPassword(false);
      }

      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save user",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const target = e.target as HTMLInputElement; // Type assertion for checkbox

    if (target.type === "checkbox") {
      if (name === "isPremium") {
        setFormData((prev) => ({
          ...prev,
          premium: {
            ...prev.premium,
            isPremium: target.checked,
            premiumSince: target.checked ? new Date().toISOString() : undefined,
            premiumExpiry: target.checked
              ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
              : undefined,
          },
        }));
      } else {
        // Handle role checkboxes
        const role = name.replace("role_", "");
        setFormData((prev) => ({
          ...prev,
          role: target.checked
            ? [...(prev.role || []), role]
            : (prev.role || []).filter((r) => r !== role),
        }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-900 text-black dark:text-gray-100">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {user ? "Edit User" : "Create User"}
          </DialogTitle>
          <DialogDescription className="text-gray-500 dark:text-gray-400">
            {user
              ? "Make changes to the user's profile here."
              : "Create a new user with the following details."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                First Name
              </label>
              <Input
                name="firstName"
                value={formData.firstName || ""}
                onChange={handleChange}
                className="w-full"
                id="admin-firstname"
                autoComplete="given-name"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Last Name
              </label>
              <Input
                name="lastName"
                value={formData.lastName || ""}
                onChange={handleChange}
                className="w-full"
                id="admin-lastname"
                autoComplete="family-name"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Username
              </label>
              <Input
                name="username"
                value={formData.username || ""}
                onChange={handleChange}
                className="w-full"
                id="admin-username"
                autoComplete="username"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <Input
                name="email"
                type="email"
                value={formData.email || ""}
                onChange={handleChange}
                className="w-full"
                id="admin-email"
                autoComplete="email"
              />
            </div>
            {!user && (
              <div className="col-span-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pr-10"
                    required={!user}
                    id="admin-password"
                    autoComplete={!user ? "new-password" : "current-password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Roles
            </label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {availableRoles.map((role) => (
                <label
                  key={role}
                  className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <input
                    type="checkbox"
                    name={`role_${role}`}
                    checked={(formData.role || []).includes(role)}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                  />
                  <span className="capitalize text-gray-700 dark:text-gray-300">
                    {role}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="isPremium"
                checked={formData.premium?.isPremium || false}
                onChange={handleChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
              />
              <div className="space-y-1">
                <span className="block font-medium text-gray-700 dark:text-gray-300">
                  Premium User
                </span>
                <span className="block text-sm text-gray-500 dark:text-gray-400">
                  Enable premium features for this user
                </span>
              </div>
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const UserManagement = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!users || !Array.isArray(users)) {
      setFilteredUsers([]);
      return;
    }
    const filtered = users.filter(
      (user) =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [users, searchQuery]);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get("/admin/users");
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    }
  };

  const handleUserUpdate = async (userData: UserDataWithPassword) => {
    if (!selectedUser) return;

    try {
      const { password: _, ...updateData } = userData;
      await api.put(`/admin/users/${selectedUser._id}`, updateData);
      await fetchUsers();
      toast({
        title: "Success",
        description: "User updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    }
  };

  const handleUserDelete = async () => {
    if (!selectedUser) return;

    try {
      await api.delete(`/admin/users/${selectedUser._id}`);
      setUsers((users) => users.filter((u) => u._id !== selectedUser._id));
      toast({
        title: "Success",
        description: "User and all associated data deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete user",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
    }
  };

  const handleCreateUser = async (userData: UserDataWithPassword) => {
    try {
      await api.post("/admin/users", userData);
      await fetchUsers();
      toast({
        title: "Success",
        description: "User created successfully",
      });
      setIsCreateDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create user",
        variant: "destructive",
      });
    }
  };

  const handleProfileClick = async (username: string) => {
    try {
      await api.get(`/users/${username}`);
      window.open(`/profile/${username}`, "_blank");
    } catch (error) {
      toast({
        title: "Error",
        description: "User profile not found",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">User Management</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)}>Create User</Button>
      </div>

      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-card">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-md">
            <EnhancedSearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by name, username, or email..."
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold">Name</TableHead>
              <TableHead className="font-semibold">Username</TableHead>
              <TableHead className="font-semibold">Email</TableHead>
              <TableHead className="font-semibold">Roles</TableHead>
              <TableHead className="font-semibold">Premium Status</TableHead>
              <TableHead className="font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow
                key={user._id}
                className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <TableCell>
                  <button
                    onClick={() => handleProfileClick(user.username)}
                    className="hover:text-blue-500 dark:hover:text-blue-400 flex items-center gap-1 transition-colors"
                  >
                    {user.firstName} {user.lastName}
                    <ExternalLink className="h-4 w-4 opacity-50 group-hover:opacity-100" />
                  </button>
                </TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1.5">
                    {user.role.map((role) => (
                      <span
                        key={role}
                        className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-xs font-medium capitalize"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  {user.premium?.isPremium ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                      Premium
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300">
                      Standard
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400"
                      onClick={() => {
                        setSelectedUser(user);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400"
                      onClick={() => {
                        setSelectedUser(user);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <EditUserDialog
        user={selectedUser}
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setSelectedUser(null);
        }}
        onSave={handleUserUpdate}
      />

      <EditUserDialog
        user={null}
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSave={handleCreateUser}
      />

      <PasswordConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedUser(null);
        }}
        onConfirm={handleUserDelete}
        title="Delete User"
        description={`Are you sure you want to delete the user '${selectedUser?.username}'? This action cannot be undone and will delete all associated data. Please enter your password to confirm.`}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
};

export default UserManagement;
