import React, { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import api from "@/services/api";

const ContactUs: React.FC = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: user ? `${user.firstName} ${user.lastName}` : "",
    email: user ? user.email : "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const isLoggedIn = !!user;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/contact", {
        name: form.name,
        email: form.email,
        message: form.message,
        userId: user?._id || null,
      });
      setSubmitted(true);
    } catch {
      //  show error in console or notify user
      console.error("Failed to send message. Please try again later.");
    }
  };

  return (
    <div className="max-w-xl mx-auto py-12 px-4 pt-30">
      <h1 className="text-3xl font-bold mb-6">Contact Us</h1>
      {submitted ? (
        <div className="bg-green-100 text-green-800 p-4 rounded mb-6">
          Thank you for contacting us! We'll get back to you soon.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block mb-1 font-medium">
              Name
            </label>
            <Input
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              disabled={isLoggedIn}
            />
          </div>
          <div>
            <label htmlFor="email" className="block mb-1 font-medium">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              disabled={isLoggedIn}
            />
          </div>
          <div>
            <label htmlFor="message" className="block mb-1 font-medium">
              Message
            </label>
            <Textarea
              id="message"
              name="message"
              value={form.message}
              onChange={handleChange}
              required
              rows={5}
            />
          </div>
          <Button type="submit" className="w-full">
            Send Message
          </Button>
        </form>
      )}
    </div>
  );
};

export default ContactUs;
