import React, { useState } from 'react';
import { Mail, RefreshCw, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/services/api';

interface EmailVerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    feature?: string;
}

const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
    isOpen,
    onClose,
    feature = "this feature"
}) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string>('');
    const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

    if (!isOpen || !user) return null;

    const resendVerification = async () => {
        try {
            setLoading(true);
            setMessage('');

            await api.post('/auth/send-verification-email', { email: user.email });

            setMessage('Verification email sent successfully! Please check your inbox.');
            setMessageType('success');
        } catch (err: any) {
            setMessage(err.response?.data?.message || 'Failed to send verification email');
            setMessageType('error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center">
                        <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                            <Mail className="w-5 h-5 text-yellow-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            Email Verification Required
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="mb-6">
                    <p className="text-gray-600 mb-4">
                        To access <strong>{feature}</strong>, you need to verify your email address first.
                    </p>
                    <p className="text-sm text-gray-500">
                        We sent a verification link to <strong>{user.email}</strong>
                    </p>
                </div>

                {message && (
                    <div className={`mb-4 p-3 rounded-lg border ${messageType === 'success'
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

                <div className="space-y-3">
                    <button
                        onClick={resendVerification}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
                    >
                        {loading ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                            <Mail className="w-4 h-4" />
                        )}
                        {loading ? 'Sending...' : 'Resend Verification Email'}
                    </button>

                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                        Close
                    </button>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 text-center">
                        Check your spam folder if you don't see the email
                    </p>
                </div>
            </div>
        </div>
    );
};

export default EmailVerificationModal;