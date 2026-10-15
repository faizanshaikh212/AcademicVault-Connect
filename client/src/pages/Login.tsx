import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthLayout from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import api from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff, Shield, AlertTriangle } from "lucide-react";
import LightRays from "@/components/background/LightRays";
import EmailVerificationPrompt from "@/components/auth/EmailVerificationPrompt";

const Login: React.FC = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [twoFactorData, setTwoFactorData] = useState({ token: "", backupCode: "" });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginStep, setLoginStep] = useState<'credentials' | '2fa' | 'verification'>('credentials');
  const [userEmail, setUserEmail] = useState<string>('');
  const navigate = useNavigate();
  const auth = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data } = await api.post("/auth/login", formData);

      if (data.requiresVerification) {
        setUserEmail(data.email);
        setLoginStep('verification');
      } else if (data.requires2FA) {
        setUserEmail(data.email);
        setLoginStep('2fa');
      } else {
        // Successful login
        auth.login({ user: data, token: data.token });
        navigate("/");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || "An error occurred during login."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data } = await api.post("/auth/verify-2fa-login", {
        email: formData.email,
        password: formData.password,
        token: twoFactorData.token,
        backupCode: twoFactorData.backupCode
      });

      auth.login({ user: data, token: data.token });
      navigate("/");
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Invalid 2FA code or backup code."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToCredentials = () => {
    setLoginStep('credentials');
    setTwoFactorData({ token: '', backupCode: '' });
    setError(null);
  };

  if (loginStep === 'verification') {
    return (
      <div className="relative min-h-[100svh] w-full overflow-hidden">
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
        <div className="relative z-10 flex min-h-[100svh] items-center justify-center px-4 py-24">
          <EmailVerificationPrompt email={userEmail} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[100svh] w-full overflow-hidden">
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

      <div className="relative z-10 w-full">
        <AuthLayout title={loginStep === '2fa' ? "Two-Factor Authentication" : "Welcome Back"}>
          {loginStep === 'credentials' ? (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4" autoComplete="on">
              <Input
                id="login-email"
                name="email"
                type="email"
                placeholder="Email"
                onChange={handleChange}
                required
                autoComplete="username"
              />
              <div className="relative">
                <Input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  onChange={handleChange}
                  required
                  className="pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Logging In..." : "Login"}
              </Button>

              <div className="text-center">
                <Link
                  to="/forgot-password"
                  className="text-sm text-blue-400 hover:underline"
                >
                  Forgot your password?
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handle2FASubmit} className="space-y-4">
              <div className="text-center mb-4">
                <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-gray-600 text-sm">
                  Enter the 6-digit code from your authenticator app or use a backup code
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Authentication Code
                </label>
                <Input
                  type="text"
                  placeholder="000000"
                  value={twoFactorData.token}
                  onChange={(e) => setTwoFactorData(prev => ({
                    ...prev,
                    token: e.target.value.replace(/\D/g, '').slice(0, 6),
                    backupCode: '' // Clear backup code when entering token
                  }))}
                  className="text-center text-lg font-mono"
                  maxLength={6}
                />
              </div>

              <div className="text-center text-gray-500 text-sm">
                or
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Backup Code
                </label>
                <Input
                  type="text"
                  placeholder="Enter backup code"
                  value={twoFactorData.backupCode}
                  onChange={(e) => setTwoFactorData(prev => ({
                    ...prev,
                    backupCode: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''),
                    token: '' // Clear token when entering backup code
                  }))}
                  className="text-center font-mono"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || (!twoFactorData.token && !twoFactorData.backupCode)}
              >
                {isLoading ? "Verifying..." : "Verify & Login"}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleBackToCredentials}
                  className="text-sm text-blue-400 hover:underline"
                >
                  Back to login
                </button>
              </div>
            </form>
          )}

          <p className="mt-4 text-center text-sm text-gray-400">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-medium text-blue-400 hover:underline"
            >
              Sign up
            </Link>
          </p>
        </AuthLayout>
      </div>
    </div>
  );
};

export default Login;
