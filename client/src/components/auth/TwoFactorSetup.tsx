import React, { useState } from 'react';
import { Shield, QrCode, Copy, Check, AlertTriangle, Key } from 'lucide-react';
import api from '@/services/api';

interface TwoFactorSetupProps {
    onComplete: () => void;
    onCancel: () => void;
}

const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({ onComplete, onCancel }) => {
    const [step, setStep] = useState<'setup' | 'verify' | 'backup'>('setup');
    const [qrCode, setQrCode] = useState<string>('');
    const [secret, setSecret] = useState<string>('');
    const [verificationCode, setVerificationCode] = useState<string>('');
    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [copied, setCopied] = useState(false);

    const setup2FA = async () => {
        try {
            setLoading(true);
            setError('');
            const { data } = await api.post('/auth/setup-2fa');
            setQrCode(data.qrCode);
            setSecret(data.secret);
            setStep('verify');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to setup 2FA');
        } finally {
            setLoading(false);
        }
    };

    const verify2FA = async () => {
        try {
            setLoading(true);
            setError('');
            const { data } = await api.post('/auth/verify-2fa-setup', {
                token: verificationCode
            });
            setBackupCodes(data.backupCodes);
            setStep('backup');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid verification code');
        } finally {
            setLoading(false);
        }
    };

    const copySecret = async () => {
        try {
            await navigator.clipboard.writeText(secret);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy secret');
        }
    };

    const copyBackupCodes = async () => {
        try {
            await navigator.clipboard.writeText(backupCodes.join('\n'));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy backup codes');
        }
    };

    const handleComplete = () => {
        onComplete();
    };

    if (step === 'setup') {
        return (
            <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
                <div className="text-center mb-6">
                    <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <Shield className="w-6 h-6 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                        Enable Two-Factor Authentication
                    </h2>
                    <p className="text-gray-600">
                        Add an extra layer of security to your account with 2FA
                    </p>
                </div>

                <div className="space-y-4 mb-6">
                    <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-blue-600 text-sm font-medium">1</span>
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">Install an authenticator app</p>
                            <p className="text-sm text-gray-600">
                                Download Google Authenticator, Authy, or similar app on your phone
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-blue-600 text-sm font-medium">2</span>
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">Scan QR code</p>
                            <p className="text-sm text-gray-600">
                                Use your authenticator app to scan the QR code we'll generate
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-blue-600 text-sm font-medium">3</span>
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">Verify setup</p>
                            <p className="text-sm text-gray-600">
                                Enter the 6-digit code from your app to complete setup
                            </p>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={setup2FA}
                        disabled={loading}
                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
                    >
                        {loading ? 'Setting up...' : 'Get Started'}
                    </button>
                </div>
            </div>
        );
    }

    if (step === 'verify') {
        return (
            <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
                <div className="text-center mb-6">
                    <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <QrCode className="w-6 h-6 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                        Scan QR Code
                    </h2>
                    <p className="text-gray-600">
                        Use your authenticator app to scan this QR code
                    </p>
                </div>

                <div className="mb-6">
                    <div className="bg-white p-4 rounded-lg border-2 border-gray-200 text-center">
                        {qrCode && (
                            <img
                                src={qrCode}
                                alt="2FA QR Code"
                                className="mx-auto max-w-full h-auto"
                            />
                        )}
                    </div>
                </div>

                <div className="mb-6">
                    <p className="text-sm font-medium text-gray-900 mb-2">
                        Can't scan? Enter this code manually:
                    </p>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <code className="flex-1 text-sm font-mono text-gray-800 break-all">
                            {secret}
                        </code>
                        <button
                            onClick={copySecret}
                            className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                        Enter verification code from your app:
                    </label>
                    <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-lg font-mono"
                        maxLength={6}
                    />
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={verify2FA}
                        disabled={loading || verificationCode.length !== 6}
                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
                    >
                        {loading ? 'Verifying...' : 'Verify & Enable'}
                    </button>
                </div>
            </div>
        );
    }

    if (step === 'backup') {
        return (
            <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
                <div className="text-center mb-6">
                    <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <Key className="w-6 h-6 text-green-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                        Save Your Backup Codes
                    </h2>
                    <p className="text-gray-600">
                        Store these codes safely. You can use them to access your account if you lose your phone.
                    </p>
                </div>

                <div className="mb-6">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-yellow-800">Important!</p>
                                <p className="text-sm text-yellow-700">
                                    Save these codes in a secure location. You won't be able to see them again.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-900">Backup Codes</span>
                            <button
                                onClick={copyBackupCodes}
                                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                            >
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                {copied ? 'Copied!' : 'Copy All'}
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {backupCodes.map((code, index) => (
                                <code key={index} className="block text-sm font-mono text-gray-800 bg-white p-2 rounded border">
                                    {code}
                                </code>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mb-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-blue-900 mb-2">What's next?</h3>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li>• Each backup code can only be used once</li>
                            <li>• Store them in a password manager or safe place</li>
                            <li>• You'll need your authenticator app or backup codes to sign in</li>
                        </ul>
                    </div>
                </div>

                <button
                    onClick={handleComplete}
                    className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                    I've Saved My Backup Codes
                </button>
            </div>
        );
    }

    return null;
};

export default TwoFactorSetup;