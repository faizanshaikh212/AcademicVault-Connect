import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthLayout from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import api from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff } from "lucide-react";
import LightRays from "@/components/background/LightRays";

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
  const navigate = useNavigate();
  const auth = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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

    try {
      const { data } = await api.post("/auth/register", formData);
      // Correctly format the data for the auth context
      auth.login({ user: data, token: data.token });
      navigate("/"); // Redirect to home on success
    } catch (err: any) {
      setError(
        err.response?.data?.message || "An error occurred during registration."
      );
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
        <AuthLayout title="Create an Account">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-4">
              <Input
                name="firstName"
                placeholder="First Name"
                onChange={handleChange}
                required
              />
              <Input
                name="lastName"
                placeholder="Last Name"
                onChange={handleChange}
                required
              />
            </div>
            <Input
              name="username"
              placeholder="Username"
              onChange={handleChange}
              required
            />
            <Input
              name="email"
              type="email"
              placeholder="Email"
              onChange={handleChange}
              required
            />
            <div className="relative">
              <Input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                onChange={handleChange}
                required
                className="pr-10"
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

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <Button type="submit" className="w-full" disabled={isLoading}>
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
