import React, { useEffect, useState } from "react";
import api from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { Shield, Monitor, Smartphone, Tablet, MapPin, Clock, AlertTriangle } from "lucide-react";
import SettingsLayout from "@/components/layout/SettingsLayout";

interface Session {
  _id: string;
  deviceName: string;
  browser: string;
  os: string;
  location: string;
  ip: string;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
  isCurrent: boolean;
  loginMethod: string;
  isSecure: boolean;
}

const SessionsPage: React.FC = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);

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
      setRevoking(id);
      await api.delete(`/auth/sessions/${id}`);
      await fetchSessions();
    } catch (err) {
      console.error("Failed to revoke session", err);
    } finally {
      setRevoking(null);
    }
  };

  const revokeAll = async () => {
    try {
      setRevoking('all');
      await api.post(`/auth/sessions/revoke-all`);
      // Redirect to login since all sessions are revoked
      window.location.href = '/login';
    } catch (err) {
      console.error("Failed to revoke all sessions", err);
      setRevoking(null);
    }
  };

  const getDeviceIcon = (deviceName: string) => {
    if (!deviceName) return <Monitor className="w-5 h-5" />;
    const name = deviceName.toLowerCase();
    if (name.includes('mobile')) return <Smartphone className="w-5 h-5" />;
    if (name.includes('tablet')) return <Tablet className="w-5 h-5" />;
    return <Monitor className="w-5 h-5" />;
  };

  const formatLastUsed = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (!user) return <p>Please sign in to view sessions.</p>;

  return (
    <SettingsLayout>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Active Sessions</h2>
        <p className="text-gray-600">
          Manage your active sessions across all devices. You can sign out of any session remotely.
        </p>
      </div>

      <div className="mb-6 flex justify-between items-center">
        <div className="text-sm text-gray-500">
          {sessions.length} active session{sessions.length !== 1 ? 's' : ''}
        </div>
        <button
          onClick={revokeAll}
          disabled={revoking === 'all'}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <AlertTriangle className="w-4 h-4" />
          {revoking === 'all' ? 'Signing out...' : 'Sign out of all devices'}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <div
              key={session._id}
              className={`bg-white border rounded-lg p-6 shadow-sm ${session.isCurrent ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
                }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getDeviceIcon(session.deviceName)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {session.deviceName}
                      </h3>
                      {session.isCurrent && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                          Current Session
                        </span>
                      )}
                      {session.isSecure && (
                        <div className="flex items-center gap-1 text-green-600">
                          <Shield className="w-4 h-4" />
                          <span className="text-xs font-medium">2FA</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Browser:</span>
                        <span>{session.browser}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">OS:</span>
                        <span>{session.os}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{session.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>Last active: {formatLastUsed(session.lastUsedAt)}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        IP: {session.ip}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  {!session.isCurrent && (
                    <button
                      onClick={() => revoke(session._id)}
                      disabled={revoking === session._id}
                      className="px-3 py-2 border border-gray-300 hover:border-red-300 hover:text-red-600 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {revoking === session._id ? 'Signing out...' : 'Sign out'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {sessions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No active sessions found.
            </div>
          )}
        </div>
      )}
    </SettingsLayout>
  );
};

export default SessionsPage;
