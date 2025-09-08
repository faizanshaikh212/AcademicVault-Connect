import React, { useEffect, useState } from "react";
import api from "@/services/api";
import { useAuth } from "@/hooks/useAuth";

interface Session {
  _id: string;
  tokenId: string;
  deviceInfo: { ua?: string; ip?: string; name?: string };
  createdAt: string;
  lastUsedAt?: string;
  expiresAt: string;
  revoked: boolean;
}

const SessionsPage: React.FC = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/auth/sessions");
      setSessions(data.sessions || []);
    } catch (err) {
      console.error("Failed to fetch sessions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchSessions();
  }, [user]);

  const revoke = async (id: string) => {
    try {
      await api.delete(`/auth/sessions/${id}`);
      fetchSessions();
    } catch (err) {
      console.error("Failed to revoke session", err);
    }
  };

  const revokeAll = async () => {
    try {
      await api.post(`/auth/sessions/revoke-all`);
      fetchSessions();
    } catch (err) {
      console.error("Failed to revoke all sessions", err);
    }
  };

  if (!user) return <p>Please sign in to view sessions.</p>;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Active Sessions</h2>
      <button
        onClick={revokeAll}
        className="mb-4 px-3 py-1 bg-red-600 text-white rounded"
      >
        Revoke all sessions
      </button>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul className="space-y-2">
          {sessions.map((s) => (
            <li
              key={s._id}
              className="p-3 border rounded flex justify-between items-center"
            >
              <div>
                <div className="font-medium">
                  {s.deviceInfo?.name || s.deviceInfo?.ua || "Unknown device"}
                </div>
                <div className="text-sm text-gray-600">
                  Last used: {s.lastUsedAt || s.createdAt}
                </div>
                <div className="text-sm text-gray-500">
                  IP: {s.deviceInfo?.ip}
                </div>
                <div className="text-sm">
                  Expires: {new Date(s.expiresAt).toLocaleString()}
                </div>
                <div className="text-sm">
                  Revoked: {s.revoked ? "Yes" : "No"}
                </div>
              </div>
              <div>
                <button
                  onClick={() => revoke(s._id)}
                  className="px-2 py-1 border rounded"
                >
                  Revoke
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SessionsPage;
