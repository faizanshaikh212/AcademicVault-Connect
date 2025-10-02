import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertTriangle, Loader } from 'lucide-react';
import AuthLayout from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import api from '@/services/api';
import LightRays from '@/components/background/LightRays';

const VerifyEmail: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const { login, user } = useAuth();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState<string>('');
    const [autoSignedIn, setAutoSignedIn] = useState<boolean>(false);

    useEffect(() => {
        const verifyEmail = async () => {
            if (!token) {
                setStatus('error');
                setMessage('Invalid verification link.');
                return;
            }

            // If user is already logged in and verified, redirect them
            if (user && user.isEmailVerified) {
                setStatus('success');
                setMessage('You are already verified and signed in!');
                setAutoSignedIn(true);
                setTimeout(() => {
                    navigate('/');
                }, 1500);
                return;
            }

            try {
                const { data } = await api.get(`/auth/verify-email/${token}`);
                setStatus('success');
                setMessage(data.message || 'Email verified successfully!');

                // If user data and token are returned, sign them in automatically
                if (data.user && data.token) {
                    login({ user: data.user, token: data.token });
                    setAutoSignedIn(true);

                    // Redirect to home after a short delay
                    setTimeout(() => {
                        navigate('/');
                    }, 2000);
                }
            } catch (err: any) {
                // Check if this is a "token already used" error
                if (err.response?.data?.code === 'TOKEN_USED_OR_EXPIRED') {
                    // Check if user is already logged in (verification might have worked previously)
                    const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
                    const currentToken = localStorage.getItem('token');

                    if (currentUser && currentToken) {
                        // User is already logged in, verification must have worked before
                        login({ user: currentUser, token: currentToken });
                        setStatus('success');
                        setMessage('Email already verified! You are now signed in.');
                        setAutoSignedIn(true);

                        setTimeout(() => {
                            navigate('/');
                        }, 1500);
                        return;
                    }
                }

                setStatus('error');
                setMessage(err.response?.data?.message || 'Email verification failed.');
            }
        };

        verifyEmail();
    }, [token]);

    const handleContinue = () => {
        if (autoSignedIn) {
            navigate('/');
        } else {
            navigate('/login');
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
                <AuthLayout title="Email Verification">
                    <div className="text-center">
                        {status === 'loading' && (
                            <>
                                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                                    <Loader className="w-8 h-8 text-blue-600 animate-spin" />
                                </div>
                                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                                    Verifying Your Email
                                </h2>
                                <p className="text-gray-600">
                                    Please wait while we verify your email address...
                                </p>
                            </>
                        )}

                        {status === 'success' && (
                            <>
                                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle className="w-8 h-8 text-green-600" />
                                </div>
                                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                                    Email Verified Successfully!
                                </h2>
                                <p className="text-gray-600 mb-6">
                                    {message}
                                    {autoSignedIn && (
                                        <span className="block mt-2 text-green-600 font-medium">
                                            You have been automatically signed in. Redirecting...
                                        </span>
                                    )}
                                </p>
                                <Button onClick={handleContinue} className="w-full">
                                    {autoSignedIn ? 'Continue to Dashboard' : 'Continue to Sign In'}
                                </Button>
                            </>
                        )}

                        {status === 'error' && (
                            <>
                                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                    <AlertTriangle className="w-8 h-8 text-red-600" />
                                </div>
                                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                                    Verification Link Issue
                                </h2>
                                <p className="text-gray-600 mb-6">
                                    {message}
                                </p>
                                <div className="space-y-3">
                                    <Button onClick={handleContinue} className="w-full">
                                        Go to Sign In
                                    </Button>
                                    <p className="text-sm text-gray-500">
                                        If you just registered, your account may have already been created. Try signing in with your credentials.
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </AuthLayout>
            </div>
        </div>
    );
};

export default VerifyEmail;