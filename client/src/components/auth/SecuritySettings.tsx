import React, { useState, useEffect } from 'react';
import { Shield, Key, Smartphone, AlertTriangle, CheckCircle, Lock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/services/api';
import TwoFactorSetup from './TwoFactorSetup';

interface SecuritySettingsProps {
    className?: string;
}

const SecuritySettings: React.FC<SecuritySettingsProps> = ({ className = '' }) => {
    const { user, refreshUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string>('');
    const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
    const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
    const [showDisable2FA, setShowDisable2FA] = useState(false);
    const [disableForm, setDisableForm] = useState({
        password: '',
        token: ''
    });

    const [userSecurity, setUserSecurity] = useState({
        twoFactorEnabled: false,
        lastPasswordChange: null as Date | null,
        emailVerified: false
    });

    useEffect(() => {
        if (user) {
            setUserSecurity({
                twoFactorEnabled: user.twoFactorEnabled || false,
                lastPasswordChange: user.lastPasswordChange ? new Date(user.lastPasswordChange) : null,
                emailVerified: user.isEmailVerified || false
            });
        }
    }, [user]);

    const handleDisable2FA = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setLoading(true);
            setMessage('');

            await api.post('/auth/disable-2fa', {
                password: disableForm.password,
                token: disableForm.token
            });

            setMessage('Two-factor authentication has been disabled successfully.');
            setMessageType('success');
            setShowDisable2FA(false);
            setDisableForm({ password: '', token: '' });

            // Refresh user data
            await refreshUser();
        } catch (err: any) {
            if (err.response?.data?.requiresReauth) {
                setMessage(
                    err.response?.data?.message ||
                    'Recent authentication required. Please log out and log back in, then try again.'
                );
            } else {
                setMessage(err.response?.data?.message || 'Failed to disable 2FA');
            }
            setMessageType('error');
        } finally {
            setLoading(false);
        }
    };

    const handleTwoFactorComplete = async () => {
        setShowTwoFactorSetup(false);
        setMessage('Two-factor authentication has been enabled successfully!');
        setMessageType('success');

        // Refresh user data
        await refreshUser();

        // Force update the local security state
        setTimeout(() => {
            if (user) {
                setUserSecurity({
                    twoFactorEnabled: user.twoFactorEnabled || false,
                    lastPasswordChange: user.lastPasswordChange ? new Date(user.lastPasswordChange) : null,
                    emailVerified: user.isEmailVerified || false
                });
            }
        }, 500);
    };

    const formatLastPasswordChange = (date: Date | null) => {
        if (!date) return 'Never';

        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 30) return `${diffDays} days ago`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
        return `${Math.floor(diffDays / 365)} years ago`;
    };

    if (showTwoFactorSetup) {
        return (
            <TwoFactorSetup
                onComplete={handleTwoFactorComplete}
                onCancel={() => setShowTwoFactorSetup(false)}
            />
        );
    }

    return (
        <div className={`max-w-4xl mx-auto ${className}`}>
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Security Settings</h2>
                <p className="text-gray-600">
                    Manage your account security and authentication methods
                </p>
            </div>

            {message && (
                <div className={`mb-6 p-4 rounded-lg border ${messageType === 'success'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                    }`}>
                    <div className="flex items-center gap-2">
                        {messageType === 'success' ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                        )}
                        <p className={`text-sm ${messageType === 'success' ? 'text-green-700' : 'text-red-700'
                            }`}>
                            {message}
                        </p>
                    </div>
                </div>
            )}

            <div className="space-y-6">
                {/* Security Overview */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Security Overview
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${userSecurity.emailVerified ? 'bg-green-100' : 'bg-red-100'
                                }`}>
                                {userSecurity.emailVerified ? (
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                ) : (
                                    <AlertTriangle className="w-5 h-5 text-red-600" />
                                )}
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">Email</p>
                                <p className={`text-sm ${userSecurity.emailVerified ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                    {userSecurity.emailVerified ? 'Verified' : 'Not Verified'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${userSecurity.twoFactorEnabled ? 'bg-green-100' : 'bg-yellow-100'
                                }`}>
                                {userSecurity.twoFactorEnabled ? (
                                    <Shield className="w-5 h-5 text-green-600" />
                                ) : (
                                    <Smartphone className="w-5 h-5 text-yellow-600" />
                                )}
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">2FA</p>
                                <p className={`text-sm ${userSecurity.twoFactorEnabled ? 'text-green-600' : 'text-yellow-600'
                                    }`}>
                                    {userSecurity.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <Key className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">Password</p>
                                <p className="text-sm text-gray-600">
                                    {formatLastPasswordChange(userSecurity.lastPasswordChange)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Two-Factor Authentication */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-2">
                                <Smartphone className="w-5 h-5" />
                                Two-Factor Authentication
                            </h3>
                            <p className="text-gray-600">
                                Add an extra layer of security to your account with 2FA using an authenticator app.
                            </p>
                        </div>

                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${userSecurity.twoFactorEnabled
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                            }`}>
                            {userSecurity.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                        </div>
                    </div>

                    {userSecurity.twoFactorEnabled ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-sm font-medium">
                                    Two-factor authentication is active on your account
                                </span>
                            </div>

                            <button
                                onClick={() => setShowDisable2FA(true)}
                                className="px-4 py-2 border border-red-300 text-red-700 hover:bg-red-50 rounded-lg font-medium transition-colors"
                            >
                                Disable 2FA
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-yellow-800">
                                            Recommended Security Enhancement
                                        </p>
                                        <p className="text-sm text-yellow-700 mt-1">
                                            Enable 2FA to significantly improve your account security. Even if someone gets your password, they won't be able to access your account without your phone.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowTwoFactorSetup(true)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                            >
                                Enable Two-Factor Authentication
                            </button>
                        </div>
                    )}
                </div>

                {/* Password Management */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                        <Lock className="w-5 h-5" />
                        Password Management
                    </h3>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                                <p className="font-medium text-gray-900">Password</p>
                                <p className="text-sm text-gray-600">
                                    Last changed {formatLastPasswordChange(userSecurity.lastPasswordChange)}
                                </p>
                            </div>
                            <a
                                href="/forgot-password"
                                className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                            >
                                Change Password
                            </a>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-blue-900 mb-2">Password Security Tips</h4>
                            <ul className="text-sm text-blue-800 space-y-1">
                                <li>• Use a unique password that you don't use anywhere else</li>
                                <li>• Make it at least 12 characters long</li>
                                <li>• Include a mix of letters, numbers, and special characters</li>
                                <li>• Consider using a password manager</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Disable 2FA Modal */}
            {showDisable2FA && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Disable Two-Factor Authentication
                        </h3>

                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-700">
                                    Disabling 2FA will make your account less secure. You'll only need your password to sign in.
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleDisable2FA} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Current Password
                                </label>
                                <input
                                    type="password"
                                    value={disableForm.password}
                                    onChange={(e) => setDisableForm(prev => ({ ...prev, password: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    2FA Code (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={disableForm.token}
                                    onChange={(e) => setDisableForm(prev => ({ ...prev, token: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                                    placeholder="000000"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center font-mono"
                                    maxLength={6}
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowDisable2FA(false);
                                        setDisableForm({ password: '', token: '' });
                                        setMessage('');
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || !disableForm.password}
                                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition-colors"
                                >
                                    {loading ? 'Disabling...' : 'Disable 2FA'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SecuritySettings;