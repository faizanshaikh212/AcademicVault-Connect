import React, { useState, useEffect } from "react";
import api from "@/services/api";
import { User } from "../../types";
import { Button } from "@/components/ui/Button";

interface RoleRequest {
  _id: string;
  user: User;
  fullName: string;
  qualifications: string;
  bio: string;
  status: string;
}

const RoleRequests: React.FC = () => {
  const [requests, setRequests] = useState<RoleRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get("/admin/rolerequests");
      setRequests(data);
    } catch (err) {
      setError("Failed to fetch role requests.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequest = async (
    requestId: string,
    action: "approve" | "reject"
  ) => {
    try {
      await api.post(`/admin/rolerequests/${requestId}`, { action });
      // Remove the handled request from the list to update the UI
      setRequests((prevRequests) =>
        prevRequests.filter((req) => req._id !== requestId)
      );
    } catch (error) {
      alert(`Failed to ${action} request.`);
    }
  };

  if (isLoading) return <p className="text-center">Loading requests...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Teacher Role Requests</h1>
      <div className="space-y-4">
        {requests.length > 0 ? (
          requests.map((req) => (
            <div
              key={req._id}
              className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">
                    {req.user.username} ({req.fullName})
                  </h3>
                  <p className="text-sm text-gray-500">{req.user.email}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    onClick={() => handleRequest(req._id, "approve")}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleRequest(req._id, "reject")}
                  >
                    Reject
                  </Button>
                </div>
              </div>
              <div className="mt-4 border-t pt-4 dark:border-gray-800">
                <p className="mt-2">
                  <strong className="font-medium text-gray-800 dark:text-gray-200">
                    Bio:
                  </strong>{" "}
                  {req.bio}
                </p>
                <p className="mt-1">
                  <strong className="font-medium text-gray-800 dark:text-gray-200">
                    Qualifications:
                  </strong>{" "}
                  {req.qualifications}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-lg">
            <p className="text-gray-500">There are no pending role requests.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleRequests;
