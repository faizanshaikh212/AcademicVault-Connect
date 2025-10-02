import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';
import AuthLayout from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/services/api';
import LightRays from '@/components/background/LightRays';

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<string>('');
    const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');

        try {
            await api.post('/auth/forgot-password', { email });
            setMessage('If an account with that email exists, we\'ve sent you a password reset link.');
            setMessageType('success');
        } catch (err: any) {
            setMessage(err.response?.data?.message || 'An error occurred. Please try again.');
            setMessageType('error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ width: "100%", height: "600px", position: "relative" }}>
            <LightRays
                raysOrigin="top-center"
                raysColor="#4b5d5dff"
                raysSpeed={1.5}
                lightSpread={0.8}
                rayLength={1.2}
                followMouse={true}
                mouseInfluence={0.1}
                noiseAmount={0.1}
                distortion={0.05}
                className="absolute inset-0 pointer-events-none z-[-1]"
            />

            <div className="absolute inset-0 flex items-center justify-center">
                <AuthLayout title="Reset Your Password">
                    <div className="text-center mb-6">
                        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                            <Mail className="w-8 h-8 text-blue-600" />
                        </div>
                        <p className="text-gray-600 text-sm">
                            Enter your email address and we'll send you a link to reset your password.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            type="email"
                            placeholder="Enter your email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                        />

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

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? 'Sending Reset Link...' : 'Send Reset Link'}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-2 text-sm text-blue-400 hover:underline"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Sign In
                        </Link>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="text-center">
                            <p className="text-xs text-gray-500 mb-2">
                                Didn't receive the email?
                            </p>
                            <ul className="text-xs text-gray-500 space-y-1">
                                <li>• Check your spam or junk folder</li>
                                <li>• Make sure the email address is correct</li>
                                <li>• Wait a few minutes and try again</li>
                            </ul>
                        </div>
                    </div>
                </AuthLayout>
            </div>
        </div>
    );
};

export default ForgotPassword;