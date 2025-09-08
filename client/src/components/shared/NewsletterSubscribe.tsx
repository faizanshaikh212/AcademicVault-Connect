import React, { useState, useEffect } from "react";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import api from "@/services/api";

const NewsletterSubscribe: React.FC = () => {
  const { user, login } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState(user?.email || "");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Update email if user logs in
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      if (!email) return;
      try {
        const response = await api.get(`/news/check-subscription/${email}`);
        setIsSubscribed(response.data.isSubscribed && response.data.isActive);
        if (response.data.isSubscribed && response.data.isActive) {
          localStorage.setItem("newsletter_subscribed", "true");
        } else {
          localStorage.removeItem("newsletter_subscribed");
        }
      } catch (error) {
        console.error("Failed to check subscription status:", error);
        setIsSubscribed(false);
        localStorage.removeItem("newsletter_subscribed");
      }
    };

    checkSubscriptionStatus();
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      await api.post("/news/subscribe", {
        email,
        userId: user?._id, // Pass userId if user is logged in
      });
      setIsSubscribed(true);

      // Refresh user data if user is logged in
      if (user?._id) {
        const { data: updatedUser } = await api.get("/users/me");
        login({
          user: updatedUser,
          token: localStorage.getItem("token"),
        });
      }

      // The subscription status check useEffect will handle localStorage
      toast({
        title: "Success!",
        description: "You've been subscribed to our newsletter.",
        variant: "default",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "Failed to subscribe. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render if already subscribed
  if (isSubscribed) {
    return null;
  }

  return (
    <section className="py-16">
      <div className="relative isolate overflow-hidden bg-gradient-to-b from-blue-400 to-blue-500 dark:from-gray-900 dark:to-gray-800 py-16 sm:py-24 rounded-3xl mx-4">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Stay Updated with Academic Vault
            </h2>
            <p className="mt-4 text-lg leading-8 text-gray-100 dark:text-gray-300">
              Get the latest news, updates, and insights delivered directly to
              your inbox.
            </p>
            <form
              onSubmit={handleSubmit}
              className="mt-10 flex gap-x-4 justify-center"
            >
              <div className="min-w-0 flex-auto">
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => !user?.email && setEmail(e.target.value)}
                  disabled={!!user?.email || isLoading}
                  placeholder="Enter your email address"
                  className={`w-full rounded-md border-0 px-3.5 py-2 text-white shadow-sm ring-1 ring-inset 
                    ring-white/20 dark:ring-white/10
                    focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6
                    ${
                      user?.email
                        ? "bg-blue-900/50 dark:bg-gray-900 cursor-not-allowed"
                        : "bg-white/5 dark:bg-white/5"
                    }
                    ${isLoading ? "opacity-50" : ""}`}
                />
              </div>
              <Button type="submit" disabled={isLoading} className="flex-none">
                {isLoading ? "Subscribing..." : "Subscribe"}
              </Button>
            </form>
          </div>
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
            fill="url(#759c1415-0410-454c-8f7c-9a820de03641)"
            fillOpacity="0.7"
          />
          <defs>
            <radialGradient
              id="759c1415-0410-454c-8f7c-9a820de03641"
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
    </section>
  );
};

export default NewsletterSubscribe;
