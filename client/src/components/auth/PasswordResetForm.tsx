import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, AlertTriangle } from 'lucide-react';
import api from '@/services/api';

const PasswordResetForm: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string>('');
    const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
    const [passwordStrength, setPasswordStrength] = useState<{
        score: number;
        feedback: string[];
    }>({ score: 0, feedback: [] });

    useEffect(() => {
        if (!token) {
            navigate('/login');
        }
    }, [token, navigate]);

    useEffect(() => {
        checkPasswordStrength(password);
    }, [password]);

    const checkPasswordStrength = (pwd: string) => {
        const feedback: string[] = [];
        let score = 0;

        if (pwd.length >= 8) {
            score += 1;
        } else {
            feedback.push('At least 8 characters');
        }

        if (/[a-z]/.test(pwd)) {
            score += 1;
        } else {
            feedback.push('One lowercase letter');
        }

        if (/[A-Z]/.test(pwd)) {
            score += 1;
        } else {
            feedback.push('One uppercase letter');
        }

        if (/\d/.test(pwd)) {
            score += 1;
        } else {
            feedback.push('One number');
        }

        if (/[^a-zA-Z0-9]/.test(pwd)) {
            score += 1;
        } else {
            feedback.push('One special character');
        }

        setPasswordStrength({ score, feedback });
    };

    const getStrengthColor = (score: number) => {
        if (score < 2) return 'bg-red-500';
        if (score < 4) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const getStrengthText = (score: number) => {
        if (score < 2) return 'Weak';
        if (score < 4) return 'Medium';
        return 'Strong';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setMessage('Passwords do not match');
            setMessageType('error');
            return;
        }

        if (passwordStrength.score < 3) {
            setMessage('Please choose a stronger password');
            setMessageType('error');
            return;
        }

        try {
            setLoading(true);
            setMessage('');

            await api.post(`/auth/reset-password/${token}`, { password });

            setMessage('Password reset successfully! Redirecting to login...');
            setMessageType('success');

            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err: any) {
            setMessage(err.response?.data?.message || 'Failed to reset password');
            setMessageType('error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <Lock className="w-8 h-8 text-blue-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">
                        Reset Your Password
                    </h2>
                    <p className="mt-2 text-gray-600">
                        Enter your new password below
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                                    placeholder="Enter new password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-4 h-4 text-gray-400" />
                                    ) : (
                                        <Eye className="w-4 h-4 text-gray-400" />
                                    )}
                                </button>
                            </div>

                            {password && (
                                <div className="mt-2">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(passwordStrength.score)}`}
                                                style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                                            />
                                        </div>
                                        <span className={`text-xs font-medium ${passwordStrength.score < 2 ? 'text-red-600' :
                                                passwordStrength.score < 4 ? 'text-yellow-600' : 'text-green-600'
                                            }`}>
                                            {getStrengthText(passwordStrength.score)}
                                        </span>
                                    </div>

                                    {passwordStrength.feedback.length > 0 && (
                                        <div className="text-xs text-gray-600">
                                            <span>Missing: </span>
                                            {passwordStrength.feedback.join(', ')}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                Confirm New Password
                            </label>
                            <div className="relative">
                                <input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                                    placeholder="Confirm new password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="w-4 h-4 text-gray-400" />
                                    ) : (
                                        <Eye className="w-4 h-4 text-gray-400" />
                                    )}
                                </button>
                            </div>

                            {confirmPassword && password !== confirmPassword && (
                                <p className="mt-1 text-xs text-red-600">
                                    Passwords do not match
                                </p>
                            )}
                        </div>
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

                    <button
                        type="submit"
                        disabled={loading || password !== confirmPassword || passwordStrength.score < 3}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? 'Resetting Password...' : 'Reset Password'}
                    </button>

                    <div className="text-center">
                        <a
                            href="/login"
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Back to Sign In
                        </a>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PasswordResetForm;