import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthLayout from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import api from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff, AlertTriangle } from "lucide-react";
import LightRays from "@/components/background/LightRays";
import EmailVerificationPrompt from "@/components/auth/EmailVerificationPrompt";

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [registrationStep, setRegistrationStep] = useState<'form' | 'verification'>('form');
  const [registeredEmail, setRegisteredEmail] = useState<string>('');
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    feedback: string[];
  }>({ score: 0, feedback: [] });
  const navigate = useNavigate();
  const auth = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === 'password') {
      checkPasswordStrength(value);
    }
  };

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
    setIsLoading(true);
    setError(null);

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setIsLoading(false);
      return;
    }

    if (passwordStrength.score < 3) {
      setError("Please choose a stronger password.");
      setIsLoading(false);
      return;
    }

    try {
      console.log('Registration data:', formData);
      const { data } = await api.post("/auth/register", formData);

      if (data.pendingVerification) {
        // New flow: User is not created yet, needs email verification first
        setRegisteredEmail(data.email);
        setRegistrationStep('verification');
      } else if (data.user && data.token) {
        // Development mode: User is created and signed in immediately
        auth.login({ user: data.user, token: data.token });
        navigate("/");
      } else {
        // Fallback
        setRegisteredEmail(data.email || formData.email);
        setRegistrationStep('verification');
      }
    } catch (err: any) {
      console.error('Registration error:', err.response?.data);
      setError(
        err.response?.data?.message || "An error occurred during registration."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (registrationStep === 'verification') {
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
          <EmailVerificationPrompt email={registeredEmail} />
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
        <AuthLayout title="Create an Account">
          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
            <div className="flex flex-col gap-4 sm:flex-row">
              <Input
                id="register-firstname"
                name="firstName"
                placeholder="First Name"
                onChange={handleChange}
                required
                autoComplete="given-name"
              />
              <Input
                id="register-lastname"
                name="lastName"
                placeholder="Last Name"
                onChange={handleChange}
                required
                autoComplete="family-name"
              />
            </div>
            <Input
              id="register-username"
              name="username"
              placeholder="Username"
              onChange={handleChange}
              required
              autoComplete="username"
            />
            <Input
              id="register-email"
              name="email"
              type="email"
              placeholder="Email"
              onChange={handleChange}
              required
              autoComplete="email"
            />
            <div className="space-y-2">
              <div className="relative">
                <Input
                  id="register-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  onChange={handleChange}
                  required
                  className="pr-10"
                  autoComplete="new-password"
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

              {formData.password && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
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
              disabled={isLoading || passwordStrength.score < 3}
            >
              {isLoading ? "Creating Account..." : "Register"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-blue-400 hover:underline"
            >
              Log in
            </Link>
          </p>
        </AuthLayout>
      </div>
    </div>
  );
};

export default Register;
