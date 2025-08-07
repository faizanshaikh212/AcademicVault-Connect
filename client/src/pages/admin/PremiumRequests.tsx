import React, { useState, useEffect } from "react";
import api from "@/services/api";
import { Button } from "@/components/ui/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { Textarea } from "@/components/ui/Textarea";
import EnhancedSearchBar from "@/components/shared/EnhancedSearchBar";
import { useToast } from "@/hooks/useToast";
import { Trash2 } from "lucide-react";
import PasswordConfirmDialog from "@/components/shared/PasswordConfirmDialog";

interface PremiumRequest {
  _id: string;
  user: {
    _id: string;
    username: string;
    email: string;
  } | null;
  fullName: string;
  paymentMethodId: string;
  status: "pending" | "approved" | "rejected";
  adminNotes: string;
  createdAt: string;
}

const AdminPremiumRequests: React.FC = () => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<PremiumRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<PremiumRequest[]>(
    []
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adminNotes, setAdminNotes] = useState<{ [key: string]: string }>({});
  const [processing, setProcessing] = useState<{ [key: string]: boolean }>({});
  const [selectedRequest, setSelectedRequest] = useState<PremiumRequest | null>(
    null
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    if (!requests || !Array.isArray(requests)) {
      setFilteredRequests([]);
      return;
    }
    const filtered = requests.filter((request) =>
      request.user
        ? request.user.username
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          request.user.email
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          request.fullName.toLowerCase().includes(searchQuery.toLowerCase())
        : request.fullName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredRequests(filtered);
  }, [requests, searchQuery]);

  const fetchRequests = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/admin/premium-requests");
      // Ensure the response data is an array
      const requestsData = Array.isArray(response.data) ? response.data : [];

      // Filter out any malformed requests and initialize admin notes
      const validRequests = requestsData.filter((req: any) => req && req._id);
      const notes: { [key: string]: string } = {};

      validRequests.forEach((req: PremiumRequest) => {
        notes[req._id] = req.adminNotes || "";
      });

      setRequests(validRequests);
      setAdminNotes(notes);
    } catch (err: any) {
      console.error("Error fetching premium requests:", err);
      setError(
        err.response?.data?.message ||
          "Failed to fetch premium requests. Please try again later."
      );
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRequest = async () => {
    if (!selectedRequest) return;

    setProcessing((prev) => ({ ...prev, [selectedRequest._id]: true }));
    try {
      await api.delete(`/admin/premium-requests/${selectedRequest._id}`);
      setRequests((prevRequests) =>
        prevRequests.filter((req) => req._id !== selectedRequest._id)
      );
      toast({
        title: "Success",
        description: "Premium request deleted successfully",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to delete request",
        variant: "destructive",
      });
    } finally {
      setProcessing((prev) => ({ ...prev, [selectedRequest._id]: false }));
      setSelectedRequest(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleStatusUpdate = async (
    requestId: string,
    status: "approved" | "rejected"
  ) => {
    setProcessing((prev) => ({ ...prev, [requestId]: true }));
    try {
      await api.put(`/admin/premium-requests/${requestId}`, {
        status,
        adminNotes: adminNotes[requestId],
      });
      // Update the local state to reflect the change
      setRequests((prevRequests) =>
        prevRequests.map((req) =>
          req._id === requestId ? { ...req, status } : req
        )
      );
      toast({
        title: "Success",
        description: `Request ${status} successfully`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to update status",
        variant: "destructive",
      });
    } finally {
      setProcessing((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Premium Requests</h1>
        <div className="w-full h-32 flex items-center justify-center">
          <div className="text-lg text-gray-600 dark:text-gray-400">
            Loading premium requests...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Premium Requests</h1>
        <div className="w-full p-4 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <Button onClick={fetchRequests} variant="outline" className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Premium Requests</h1>
        </div>

        <div className="max-w-md">
          <EnhancedSearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by name, username, or email..."
          />
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Payment ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Admin Notes</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((request) => (
                <TableRow key={request._id}>
                  <TableCell>
                    <div>
                      {request.user ? (
                        <>
                          <p className="font-medium">{request.user.username}</p>
                          <p className="text-sm text-gray-500">
                            {request.user.email}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-gray-500">User not found</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{request.fullName || "N/A"}</TableCell>
                  <TableCell>{request.paymentMethodId || "N/A"}</TableCell>
                  <TableCell>
                    {new Date(request.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        request.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : request.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {request.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Textarea
                      value={adminNotes[request._id] || ""}
                      onChange={(e) =>
                        setAdminNotes((prev) => ({
                          ...prev,
                          [request._id]: e.target.value,
                        }))
                      }
                      rows={2}
                      className="w-full"
                      placeholder="Add notes..."
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-2">
                      {request.status === "pending" && (
                        <>
                          <Button
                            onClick={() =>
                              handleStatusUpdate(request._id, "approved")
                            }
                            disabled={processing[request._id]}
                            className="w-full"
                          >
                            Approve
                          </Button>
                          <Button
                            onClick={() =>
                              handleStatusUpdate(request._id, "rejected")
                            }
                            variant="destructive"
                            disabled={processing[request._id]}
                            className="w-full"
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(request);
                          setIsDeleteDialogOpen(true);
                        }}
                        className="w-full hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400"
                        disabled={processing[request._id]}
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
      </div>

      <PasswordConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedRequest(null);
        }}
        onConfirm={handleDeleteRequest}
        title="Delete Premium Request"
        description="Are you sure you want to delete this premium request? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
};

export default AdminPremiumRequests;
