import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import api from "@/services/api";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/useToast";

const NewsLetter: React.FC = () => {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email || "");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/news/subscribe", { email });
      setIsSubscribed(true);
      toast({
        title: "Success!",
        description: "You have been subscribed to our newsletter.",
        variant: "default",
      });
      // Store subscription status in localStorage to hide component across pages
      localStorage.setItem("newsletter_subscribed", "true");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to subscribe",
        variant: "destructive",
      });
    }
  };

  // Don't show if already subscribed
  if (
    isSubscribed ||
    localStorage.getItem("newsletter_subscribed") === "true"
  ) {
    return null;
  }

  return (
    <div className="w-full bg-white dark:bg-gray-900 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative isolate overflow-hidden bg-gray-900 py-16 sm:py-24 rounded-3xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Get notified of our latest updates
            </h2>
            <p className="mt-4 text-lg leading-8 text-gray-300">
              Stay ahead in the academic world. Subscribe to our newsletter for
              exclusive insights and updates.
            </p>
            <form
              onSubmit={handleSubmit}
              className="mt-10 flex gap-x-4 justify-center"
            >
              <div className="min-w-0 flex-auto">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => !user?.email && setEmail(e.target.value)}
                  disabled={!!user?.email}
                  className={`block w-full rounded-md border-0 px-4 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 ${
                    user?.email ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                  placeholder="Enter your email"
                />
              </div>
              <Button type="submit" variant="default" className="flex-none">
                Subscribe
              </Button>
            </form>
          </div>
          <svg
            viewBox="0 0 1024 1024"
            className="absolute left-1/2 top-1/2 -z-10 h-[64rem] w-[64rem] -translate-x-1/2"
            aria-hidden="true"
          >
            <circle
              cx={512}
              cy={512}
              r={512}
              fill="url(#gradient)"
              fillOpacity="0.7"
            />
            <defs>
              <radialGradient
                id="gradient"
                cx={0}
                cy={0}
                r={1}
                gradientUnits="userSpaceOnUse"
                gradientTransform="translate(512 512) rotate(90) scale(512)"
              >
                <stop stopColor="#3b82f6" />
                <stop offset={1} stopColor="#1d4ed8" stopOpacity={0} />
              </radialGradient>
            </defs>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default NewsLetter;
