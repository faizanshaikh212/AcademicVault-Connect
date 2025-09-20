import React, { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import Particles from "@/components/background/Particles";
import { useAuth } from "@/hooks/useAuth";
import api from "@/services/api";
import NewsletterSubscribe from "@/components/shared/NewsletterSubscribe";
import { useToast } from "@/hooks/useToast";

const ContactUs: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: user ? `${user.firstName} ${user.lastName}` : "",
    email: user ? user.email : "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isLoggedIn = !!user;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post("/contact", {
        name: form.name,
        email: form.email,
        message: form.message,
        userId: user?._id || null,
      });
      setSubmitted(true);
      toast({
        title: "Success",
        description: "Your message has been sent successfully.",
        variant: "default",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full min-h-screen bg-gray-900 pt-10">
      <Particles
        className="absolute inset-0 z-0"
        particleCount={100}
        particleSpread={10}
        speed={0.1}
        particleBaseSize={100}
        moveParticlesOnHover={true}
        alphaParticles={false}
        disableRotation={false}
      />
      <div className="relative z-10 max-w-6xl mx-auto py-12 px-4">
        <h1 className="text-4xl font-bold mb-8 text-center text-white">
          Contact Us
        </h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="lg:col-span-1">
            <div className="bg-white/10 dark:bg-gray-800/50 backdrop-blur-lg p-8 rounded-xl shadow-lg border border-white/10">
              <h2 className="text-2xl font-semibold mb-6 text-white">
                Send us a Message
              </h2>
              {submitted ? (
                <div className="bg-green-100/20 dark:bg-green-900/20 text-green-800 dark:text-green-100 p-4 rounded mb-6 backdrop-blur-sm">
                  Thank you for contacting us! We'll get back to you soon.
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label
                      htmlFor="name"
                      className="block mb-1 font-medium text-white"
                    >
                      Name
                    </label>
                    <Input
                      id="name"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      disabled={isLoggedIn || isLoading}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block mb-1 font-medium text-white"
                    >
                      Email
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      disabled={isLoggedIn || isLoading}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="message"
                      className="block mb-1 font-medium text-white"
                    >
                      Message
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      required
                      rows={5}
                      disabled={isLoading}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              )}
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="bg-white/10 dark:bg-gray-800/50 backdrop-blur-lg p-8 rounded-xl shadow-lg h-full border border-white/10">
              <h2 className="text-2xl font-semibold mb-6 text-white">
                Contact Information
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2 text-white">Email</h3>
                  <p className="text-gray-300 dark:text-gray-300">
                    support@academicvault.com
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2 text-white">
                    Office Hours
                  </h3>
                  <p className="text-gray-300 dark:text-gray-300">
                    Monday - Friday: 9:00 AM - 5:00 PM
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2 text-white">
                    Location
                  </h3>
                  <p className="text-gray-300 dark:text-gray-300">
                    Virtual Office
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Newsletter section */}
      <div className="mt-16 w-full">
        <NewsletterSubscribe />
      </div>
    </div>
  );
};

export default ContactUs;
