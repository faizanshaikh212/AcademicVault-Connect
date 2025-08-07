import { useState, useEffect } from "react";
import api from "@/services/api";
import { User } from "@/types";
import { Button } from "@/components/ui/Button";
import SearchBar from "@/components/shared/SearchBar";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { ExternalLink, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/useToast";

const availableRoles = ["student", "teacher", "admin"];

interface EditUserDialogProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: Partial<User>) => Promise<void>;
}

const EditUserDialog: React.FC<EditUserDialogProps> = ({
  user,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<User>>({});
  const [saving, setSaving] = useState(false);

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
    setSaving(true);
    try {
      await onSave(formData);
      onClose();
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Make changes to the user's profile here.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-2">
              <label className="text-sm font-medium">First Name</label>
              <input
                name="firstName"
                value={formData.firstName || ""}
                onChange={handleChange}
                className="w-full mt-1 p-2 border rounded"
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium">Last Name</label>
              <input
                name="lastName"
                value={formData.lastName || ""}
                onChange={handleChange}
                className="w-full mt-1 p-2 border rounded"
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium">Username</label>
              <input
                name="username"
                value={formData.username || ""}
                onChange={handleChange}
                className="w-full mt-1 p-2 border rounded"
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium">Email</label>
              <input
                name="email"
                type="email"
                value={formData.email || ""}
                onChange={handleChange}
                className="w-full mt-1 p-2 border rounded"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Roles</label>
            <div className="mt-2 flex gap-4">
              {availableRoles.map((role) => (
                <label key={role} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name={`role_${role}`}
                    checked={(formData.role || []).includes(role)}
                    onChange={handleChange}
                  />
                  <span className="capitalize">{role}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isPremium"
                checked={formData.premium?.isPremium || false}
                onChange={handleChange}
              />
              <span>Premium User</span>
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

const UserManagementV2 = () => {
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

  const handleUserUpdate = async (userData: Partial<User>) => {
    if (!selectedUser) return;

    try {
      await api.put(`/admin/users/${selectedUser._id}`, userData);
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
      await fetchUsers();
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
    }
  };

  const handleCreateUser = async (userData: Partial<User>) => {
    try {
      await api.post("/admin/users", userData);
      await fetchUsers();
      toast({
        title: "Success",
        description: "User created successfully",
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create user",
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

      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search users..."
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Username</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Roles</TableHead>
            <TableHead>Premium Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredUsers.map((user) => (
            <TableRow key={user._id}>
              <TableCell>
                <button
                  onClick={() => handleProfileClick(user.username)}
                  className="hover:text-blue-500 flex items-center gap-1"
                >
                  {user.firstName} {user.lastName}
                  <ExternalLink className="h-4 w-4" />
                </button>
              </TableCell>
              <TableCell>{user.username}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {user.role.map((role) => (
                    <span
                      key={role}
                      className="px-2 py-1 bg-gray-100 rounded text-sm capitalize"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                {user.premium?.isPremium ? (
                  <span className="text-green-500">Premium</span>
                ) : (
                  <span className="text-gray-500">Standard</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
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

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedUser(null);
        }}
        onConfirm={handleUserDelete}
        title="Delete User"
        description="Are you sure you want to delete this user? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
};

export default UserManagementV2;
