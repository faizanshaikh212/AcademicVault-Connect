import React, { useState } from "react";
import api from "@/services/api";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";

const RoleRequest: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    qualifications: "",
    bio: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    try {
      const { data } = await api.post("/users/request-teacher-role", formData);
      setMessage({ type: "success", text: data.message });
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "An error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 pt-30">
      <h1 className="text-3xl font-bold mb-6">Request Teacher Role</h1>
      <p className="mb-6 text-gray-600 dark:text-gray-400">
        If you are an educator, please fill out the form below. Your application
        will be reviewed by an administrator.
      </p>
      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-white dark:bg-gray-900 p-8 rounded-lg shadow-md"
      >
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium mb-1">
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
            htmlFor="qualifications"
            className="block text-sm font-medium mb-1"
          >
            Qualifications
          </label>
          <Textarea
            id="qualifications"
            name="qualifications"
            value={formData.qualifications}
            onChange={handleInputChange}
            rows={4}
            required
            placeholder="E.g., PhD in Computer Science, 10 years of teaching experience..."
          />
        </div>
        <div>
          <label htmlFor="bio" className="block text-sm font-medium mb-1">
            Short Bio
          </label>
          <Textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            rows={4}
            required
            placeholder="Tell us a bit about yourself and your teaching philosophy."
          />
        </div>

        {message && (
          <p
            className={`text-sm ${
              message.type === "success" ? "text-green-500" : "text-red-500"
            }`}
          >
            {message.text}
          </p>
        )}

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Submitting..." : "Submit Request"}
        </Button>
      </form>
    </div>
  );
};

export default RoleRequest;
