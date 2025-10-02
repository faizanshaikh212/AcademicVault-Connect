import React, { useState } from 'react';
import { Mail, X, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/services/api';

const EmailVerificationBanner: React.FC = () => {
    const { user } = useAuth();
    const [dismissed, setDismissed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string>('');
    const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

    // Don't show if user is verified, not logged in, or banner is dismissed
    if (!user || user.isEmailVerified || dismissed) {
        return null;
    }

    const resendVerification = async () => {
        try {
            setLoading(true);
            setMessage('');

            await api.post('/auth/send-verification-email', { email: user.email });

            setMessage('Verification email sent! Check your inbox.');
            setMessageType('success');
        } catch (err: any) {
            setMessage(err.response?.data?.message || 'Failed to send verification email');
            setMessageType('error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-yellow-50 border-b border-yellow-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <Mail className="w-5 h-5 text-yellow-600 mr-3" />
                            <div className="flex-1">
                                <p className="text-sm text-yellow-800">
                                    <strong>Email verification required:</strong> Please verify your email address to access all features.
                                </p>
                                {message && (
                                    <div className={`mt-1 flex items-center gap-1 text-xs ${messageType === 'success' ? 'text-green-700' : 'text-red-700'
                                        }`}>
                                        {messageType === 'success' ? (
                                            <CheckCircle className="w-3 h-3" />
                                        ) : (
                                            <AlertTriangle className="w-3 h-3" />
                                        )}
                                        {message}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={resendVerification}
                                disabled={loading}
                                className="inline-flex items-center px-3 py-1 border border-yellow-300 rounded-md text-xs font-medium text-yellow-800 bg-yellow-100 hover:bg-yellow-200 disabled:opacity-50 transition-colors"
                            >
                                {loading ? (
                                    <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                                ) : (
                                    <Mail className="w-3 h-3 mr-1" />
                                )}
                                {loading ? 'Sending...' : 'Resend Email'}
                            </button>
                            <button
                                onClick={() => setDismissed(true)}
                                className="text-yellow-600 hover:text-yellow-800 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmailVerificationBanner;