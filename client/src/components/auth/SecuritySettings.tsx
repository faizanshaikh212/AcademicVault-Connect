import React, { useState, useEffect } from 'react';
import { Shield, Key, Smartphone, AlertTriangle, CheckCircle, Lock, Eye, EyeOff } from 'lucide-react';
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
        token: '',
        backupCode: ''
    });
    const [showBackupCodes, setShowBackupCodes] = useState(false);
    const [backupCodesPassword, setBackupCodesPassword] = useState('');
    const [backupCodes, setBackupCodes] = useState<Array<string | { code: string; isUsed: boolean }>>([]);
    const [regeneratePassword, setRegeneratePassword] = useState('');
    const [showRegenerateForm, setShowRegenerateForm] = useState(false);
    const [showBackupPassword, setShowBackupPassword] = useState(false);
    const [showRegeneratePasswordField, setShowRegeneratePasswordField] = useState(false);
    const [showDisablePassword, setShowDisablePassword] = useState(false);

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

    // Remove auto-fetch to avoid 403 errors - user will manually check codes when needed

    const handleShowBackupCodes = async () => {
        if (!backupCodesPassword) {
            setMessage('Password is required to view backup codes');
            setMessageType('error');
            return;
        }

        try {
            setLoading(true);
            setMessage('');

            // Fetch backup codes with password verification
            const { data } = await api.post('/auth/backup-codes-with-password', {
                password: backupCodesPassword
            });
            setBackupCodes(data.backupCodes || []);
            setShowBackupCodes(true);
            setBackupCodesPassword('');

            // Show warning if low on codes
            if (data.isLowOnCodes) {
                setMessage(`Warning: You only have ${data.remainingCodes} backup codes remaining. Consider generating new codes.`);
                setMessageType('error');
            }
        } catch (err: any) {
            setMessage(err.response?.data?.message || 'Failed to fetch backup codes');
            setMessageType('error');
        } finally {
            setLoading(false);
        }
    };

    const handleRegenerateBackupCodes = async () => {
        if (!regeneratePassword) {
            setMessage('Password is required to regenerate backup codes');
            setMessageType('error');
            return;
        }

        try {
            setLoading(true);
            setMessage('');

            // Regenerate backup codes
            const { data } = await api.post('/auth/regenerate-backup-codes', {
                password: regeneratePassword
            });
            setBackupCodes(data.backupCodes || []);
            setRegeneratePassword('');
            setShowRegenerateForm(false);
            setShowBackupCodes(true); // Show the new codes
            setMessage('New backup codes generated successfully! Please save them securely. Your old codes are no longer valid.');
            setMessageType('success');
        } catch (err: any) {
            setMessage(err.response?.data?.message || 'Failed to regenerate backup codes');
            setMessageType('error');
        } finally {
            setLoading(false);
        }
    };

    // Check if backup codes are running low
    const remainingCodes = backupCodes.filter(codeObj => {
        return typeof codeObj === 'object' ? !codeObj.isUsed : true;
    }).length;
    const isLowOnCodes = remainingCodes <= 3 && remainingCodes > 0;

    const handleDisable2FA = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setLoading(true);
            setMessage('');

            await api.post('/auth/disable-2fa', {
                password: disableForm.password,
                token: disableForm.token,
                backupCode: disableForm.backupCode
            });

            // Immediately update local security state
            setUserSecurity(prev => ({
                ...prev,
                twoFactorEnabled: false
            }));

            setMessage('Two-factor authentication has been disabled successfully. You will be logged out for security.');
            setMessageType('success');
            setShowDisable2FA(false);
            setDisableForm({ password: '', token: '', backupCode: '' });

            // Wait a moment for user to see the message, then logout
            setTimeout(() => {
                // Force logout since all sessions are revoked
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                window.location.href = '/login';
            }, 2000);
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

        // Immediately update local security state
        setUserSecurity(prev => ({
            ...prev,
            twoFactorEnabled: true
        }));

        // Refresh user data
        await refreshUser();
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

                            <div className="space-y-3">
                                <button
                                    onClick={() => setShowDisable2FA(true)}
                                    className="px-4 py-2 border border-red-300 text-red-700 hover:bg-red-50 rounded-lg font-medium transition-colors"
                                >
                                    Disable 2FA
                                </button>

                                {/* Backup Codes Section */}
                                <div className="border-t pt-4">
                                    <h4 className="text-sm font-medium text-gray-900 mb-2">Backup Codes</h4>
                                    <p className="text-sm text-gray-600 mb-3">
                                        Use backup codes to access your account if you lose your authenticator device.
                                    </p>

                                    {!showBackupCodes ? (
                                        <div className="space-y-2">
                                            <div className="relative">
                                                <input
                                                    type={showBackupPassword ? "text" : "password"}
                                                    placeholder="Enter your password"
                                                    value={backupCodesPassword}
                                                    onChange={(e) => setBackupCodesPassword(e.target.value)}
                                                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowBackupPassword(!showBackupPassword)}
                                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                                >
                                                    {showBackupPassword ? (
                                                        <EyeOff className="w-4 h-4" />
                                                    ) : (
                                                        <Eye className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </div>
                                            <button
                                                onClick={handleShowBackupCodes}
                                                disabled={loading || !backupCodesPassword}
                                                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                                            >
                                                {loading ? 'Verifying...' : 'Show Backup Codes'}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {isLowOnCodes && (
                                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <AlertTriangle className="w-4 h-4 text-red-600" />
                                                        <p className="text-sm font-medium text-red-800">
                                                            Warning: Only {remainingCodes} backup codes remaining!
                                                        </p>
                                                    </div>
                                                    <p className="text-sm text-red-700 mt-1">
                                                        Generate new backup codes to avoid being locked out of your account.
                                                    </p>
                                                </div>
                                            )}

                                            <div className="bg-gray-50 rounded-lg p-4">
                                                <div className="grid grid-cols-2 gap-2">
                                                    {backupCodes.map((codeObj, index) => {
                                                        const isUsed = typeof codeObj === 'object' ? codeObj.isUsed : false;
                                                        const code = typeof codeObj === 'object' ? codeObj.code : codeObj;
                                                        return (
                                                            <div
                                                                key={index}
                                                                className={`p-2 rounded border font-mono text-sm ${isUsed
                                                                    ? 'bg-red-100 border-red-300 text-red-700 line-through'
                                                                    : 'bg-white border-gray-300 text-gray-800'
                                                                    }`}
                                                            >
                                                                {code}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                <p className="text-xs text-gray-500 mt-2">
                                                    {remainingCodes} backup codes available
                                                </p>
                                            </div>

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        setShowBackupCodes(false);
                                                        setBackupCodes([]);
                                                    }}
                                                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                                                >
                                                    Hide Codes
                                                </button>
                                                <button
                                                    onClick={() => setShowRegenerateForm(true)}
                                                    className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                                >
                                                    Generate New Codes
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
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

            {/* Regenerate Backup Codes Modal */}
            {showRegenerateForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Generate New Backup Codes
                        </h3>

                        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-yellow-700">
                                    This will generate 10 new backup codes and invalidate all your existing backup codes. Make sure to save the new codes securely.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Current Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showRegeneratePasswordField ? "text" : "password"}
                                        value={regeneratePassword}
                                        onChange={(e) => setRegeneratePassword(e.target.value)}
                                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowRegeneratePasswordField(!showRegeneratePasswordField)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                    >
                                        {showRegeneratePasswordField ? (
                                            <EyeOff className="w-4 h-4" />
                                        ) : (
                                            <Eye className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowRegenerateForm(false);
                                        setRegeneratePassword('');
                                        setMessage('');
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleRegenerateBackupCodes}
                                    disabled={loading || !regeneratePassword}
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
                                >
                                    {loading ? 'Generating...' : 'Generate New Codes'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                                <div className="relative">
                                    <input
                                        type={showDisablePassword ? "text" : "password"}
                                        value={disableForm.password}
                                        onChange={(e) => setDisableForm(prev => ({ ...prev, password: e.target.value }))}
                                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowDisablePassword(!showDisablePassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                    >
                                        {showDisablePassword ? (
                                            <EyeOff className="w-4 h-4" />
                                        ) : (
                                            <Eye className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    2FA Code or Backup Code
                                </label>
                                <input
                                    type="text"
                                    value={disableForm.token}
                                    onChange={(e) => setDisableForm(prev => ({ ...prev, token: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                                    placeholder="000000"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center font-mono mb-2"
                                    maxLength={6}
                                />
                                <p className="text-xs text-gray-500 mb-2">Enter your 6-digit 2FA code</p>

                                <div className="text-center text-sm text-gray-500 mb-2">OR</div>

                                <input
                                    type="text"
                                    value={disableForm.backupCode}
                                    onChange={(e) => setDisableForm(prev => ({ ...prev, backupCode: e.target.value.toUpperCase().replace(/[^A-F0-9]/g, '').slice(0, 8) }))}
                                    placeholder="BACKUP CODE"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center font-mono"
                                    maxLength={8}
                                />
                                <p className="text-xs text-gray-500 mt-1">Enter one of your 8-character backup codes</p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowDisable2FA(false);
                                        setDisableForm({ password: '', token: '', backupCode: '' });
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