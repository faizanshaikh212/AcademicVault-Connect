import React, { useState } from 'react';
import { Mail, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import api from '@/services/api';

interface EmailVerificationPromptProps {
    email: string;
}

const EmailVerificationPrompt: React.FC<EmailVerificationPromptProps> = ({
    email
}) => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string>('');
    const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

    const resendVerification = async () => {
        try {
            setLoading(true);
            setMessage('');

            await api.post('/auth/send-verification-email', { email });

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
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
            <div className="text-center mb-6">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Mail className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                    Verify Your Email
                </h2>
                <p className="text-gray-600">
                    We've sent a verification link to <strong>{email}</strong>
                </p>
            </div>

            <div className="space-y-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-blue-900 mb-2">Next steps:</h3>
                    <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                        <li>Check your email inbox (and spam folder)</li>
                        <li>Click the verification link in the email</li>
                        <li>Return here to sign in to your account</li>
                    </ol>
                </div>

                {message && (
                    <div className={`p-4 rounded-lg border ${messageType === 'success'
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
            </div>

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

                <div className="text-center">
                    <p className="text-sm text-gray-600">
                        Already verified?{' '}
                        <a
                            href="/login"
                            className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Sign in here
                        </a>
                    </p>
                </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="text-center">
                    <p className="text-xs text-gray-500 mb-2">
                        Didn't receive the email?
                    </p>
                    <ul className="text-xs text-gray-500 space-y-1">
                        <li>• Check your spam or junk folder</li>
                        <li>• Make sure {email} is correct</li>
                        <li>• Wait a few minutes and try again</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default EmailVerificationPrompt;