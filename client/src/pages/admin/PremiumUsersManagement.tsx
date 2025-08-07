import { useState, useEffect } from "react";
import { User } from "@/types";
import api from "@/services/api";
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
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { RefreshCcw, Shield, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/useToast";

const PremiumUsersManagement = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false);
  const [isRenewDialogOpen, setIsRenewDialogOpen] = useState(false);

  // Fetch premium users
  useEffect(() => {
    fetchPremiumUsers();
  }, []);

  // Filter users based on search
  useEffect(() => {
    if (!users || !Array.isArray(users)) {
      setFilteredUsers([]);
      return;
    }
    const filtered = users.filter(
      (user) =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [users, searchQuery]);

  const fetchPremiumUsers = async () => {
    try {
      const { data } = await api.get("/admin/premium-users");
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      setUsers([]);
      toast({
        title: "Error",
        description: "Failed to fetch premium users",
        variant: "destructive",
      });
    }
  };

  const handleRevokePremium = async () => {
    if (!selectedUser) return;
    try {
      await api.post(`/admin/users/${selectedUser._id}/revoke-premium`);
      await fetchPremiumUsers();
      toast({
        title: "Success",
        description: "Premium status revoked successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to revoke premium status",
        variant: "destructive",
      });
    } finally {
      setIsRevokeDialogOpen(false);
      setSelectedUser(null);
    }
  };

  const handleRenewPremium = async () => {
    if (!selectedUser) return;
    try {
      await api.post(`/admin/users/${selectedUser._id}/renew-premium`);
      await fetchPremiumUsers();
      toast({
        title: "Success",
        description: "Premium subscription renewed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to renew premium subscription",
        variant: "destructive",
      });
    } finally {
      setIsRenewDialogOpen(false);
      setSelectedUser(null);
    }
  };

  const getDaysRemaining = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Premium Users Management</h1>
      </div>

      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search premium users..."
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Username</TableHead>
            <TableHead>Premium Since</TableHead>
            <TableHead>Expiry</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredUsers.map((user) => {
            const daysRemaining = user.premium?.premiumExpiry
              ? getDaysRemaining(user.premium.premiumExpiry)
              : null;

            return (
              <TableRow key={user._id}>
                <TableCell>
                  <a
                    href={`/profile/${user.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-500 flex items-center gap-1"
                  >
                    {user.firstName} {user.lastName}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>
                  {user.premium?.premiumSince
                    ? new Date(user.premium.premiumSince).toLocaleDateString()
                    : "N/A"}
                </TableCell>
                <TableCell>
                  {user.premium?.premiumExpiry
                    ? new Date(user.premium.premiumExpiry).toLocaleDateString()
                    : "N/A"}
                </TableCell>
                <TableCell>
                  {daysRemaining !== null && (
                    <Badge variant={daysRemaining > 7 ? "success" : "warning"}>
                      {daysRemaining} days remaining
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(user);
                        setIsRenewDialogOpen(true);
                      }}
                    >
                      <RefreshCcw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(user);
                        setIsRevokeDialogOpen(true);
                      }}
                    >
                      <Shield className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Revoke Premium Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isRevokeDialogOpen}
        onClose={() => setIsRevokeDialogOpen(false)}
        onConfirm={handleRevokePremium}
        title="Revoke Premium Status"
        description="Are you sure you want to revoke this user's premium status? This will remove all their premium features immediately."
        confirmText="Revoke"
        variant="destructive"
      />

      {/* Renew Premium Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isRenewDialogOpen}
        onClose={() => setIsRenewDialogOpen(false)}
        onConfirm={handleRenewPremium}
        title="Renew Premium Subscription"
        description="This will extend the user's premium subscription by 30 days from today."
        confirmText="Renew"
      />
    </div>
  );
};

export default PremiumUsersManagement;
