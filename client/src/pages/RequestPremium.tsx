import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import api from "@/services/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const RequestPremium: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: `${user?.firstName} ${user?.lastName}`,
    paymentMethodId: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      const response = await api.post("/premium/request-premium", formData);
      setMessage(response.data.message);
      setTimeout(() => {
        navigate("/settings");
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to submit request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user?.premium.isPremium) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8 pt-32">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-4">Premium Status</h1>
          <p className="text-green-500 dark:text-green-400">
            You already have premium status!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 pt-32">
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Request Premium Status</h1>

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Premium Benefits:</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>Use animated GIFs as your profile picture</li>
            <li>Priority support</li>
            <li>Early access to new features</li>
            <li>Premium badge on your profile</li>
            <li>More benefits coming soon!</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="fullName"
              className="block text-sm font-medium mb-1"
            >
              Full Name
            </label>
            <Input
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <label
              htmlFor="paymentMethodId"
              className="block text-sm font-medium mb-1"
            >
              Payment Method ID
            </label>
            <Input
              id="paymentMethodId"
              name="paymentMethodId"
              value={formData.paymentMethodId}
              onChange={handleInputChange}
              placeholder="1234567890@upi"
              required
              pattern="^[a-zA-Z0-9]+@[a-zA-Z]+$"
              title="Please enter a valid payment ID (e.g., 1234567890@upi)"
            />
            <p className="text-xs text-gray-500 mt-1">
              Format: numbers/letters@provider (e.g., 1234567890@upi)
            </p>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          {message && <p className="text-green-500 text-sm">{message}</p>}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Request"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default RequestPremium;
