import React, { createContext, useState, useEffect, ReactNode } from "react";
import { AuthContextType, AuthState, User } from "@/types";
import api from "@/services/api";

// Cookie consent state
// Create the context with a default value
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * The AuthProvider component is responsible for managing the authentication state
 * and providing it to the rest of the application.
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // null = not decided yet, true = accepted, false = declined
  const [cookieConsent, setCookieConsentState] = useState<boolean | null>(
    () => {
      try {
        const v = localStorage.getItem("cookieConsent");
        if (v === "true") return true;
        if (v === "false") return false;
        return null;
      } catch (e) {
        return null;
      }
    }
  );

  // cookieSettings allow per-category choices; null means undecided
  const [cookieSettings, setCookieSettingsState] = useState<{
    necessary: true;
    preferences: boolean;
    analytics: boolean;
    marketing: boolean;
  } | null>(() => {
    try {
      const raw = localStorage.getItem("cookieSettings");
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  });

  const [cookieModalOpen, setCookieModalOpen] = useState(false);

  useEffect(() => {
    // On initial load: try silent refresh using httpOnly refresh cookie
    let mounted = true;
    // (Global guard moved below after helper declarations)

    const restoreFromLocal = (): { restored: boolean } => {
      try {
        const storedUser = localStorage.getItem("user");
        const storedToken = localStorage.getItem("token");

        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
          return { restored: true };
        }
        return { restored: false };
      } catch (error) {
        console.error("Failed to parse auth data from localStorage", error);
        // Clear potentially corrupted data
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        return { restored: false };
      }
    };

    const attemptSilentRefresh = async () => {
      try {
        // Call refresh endpoint; this will use the httpOnly refresh cookie
        const resp = await api.post("/auth/refresh", null, {
          withCredentials: true,
        });

        // If server responds with non-OK status in some environments, treat it as failure
        if (!resp || resp.status >= 400) {
          console.debug("Silent refresh returned non-OK status", resp?.status);
          return;
        }

        const { token } = resp.data || {};
        if (token) {
          // store token and fetch user
          localStorage.setItem("token", token);
          setToken(token);
          try {
            const { data: userData } = await api.get("/users/me");
            if (!mounted) return;
            setUser(userData);
            localStorage.setItem("user", JSON.stringify(userData));
          } catch (e) {
            console.error("Failed to fetch user after refresh", e);
          }
        }
      } catch (err) {
        // silent refresh failed; leave local state as-is (user may be unauthenticated)
        console.debug(
          "Silent refresh failed:",
          (err as any)?.response?.status || err
        );
      } finally {
        // Ensure loading state is cleared so the app doesn't stay stuck in 'Loading...'
        if (mounted) setIsLoading(false);
      }
    };

    // Global guard to avoid duplicate silent refresh attempts (React StrictMode may
    // mount the provider twice in development). We set a window flag so only the
    // first mount performs the network refresh attempt.
    const GLOBAL_REFRESH_KEY = "__avc_silentRefreshStarted";
    if (typeof window !== "undefined" && (window as any)[GLOBAL_REFRESH_KEY]) {
      restoreFromLocal();
      if (mounted) setIsLoading(false);
    } else {
      if (typeof window !== "undefined")
        (window as any)[GLOBAL_REFRESH_KEY] = true;
      const restoredResult = restoreFromLocal();
      // In development, avoid making a silent refresh network call when there
      // is no stored token/user to prevent noisy 401s in the console while
      // developing. In production we still attempt silent refresh so returning
      // users are preserved.
      const isDev =
        typeof import.meta !== "undefined" &&
        (import.meta as any).env?.MODE === "development";
      if (restoredResult.restored) {
        // If we restored a token locally, no need to call refresh immediately
        if (mounted) setIsLoading(false);
      } else if (!isDev) {
        // Only attempt silent refresh in non-development (production) when
        // there is no local stored token. This keeps dev console clean.
        attemptSilentRefresh();
      } else {
        // Development and no local token: skip network refresh to avoid 401 noise
        if (mounted) setIsLoading(false);
      }
    }

    return () => {
      mounted = false;
    };
  }, []);

  // Check subscription status whenever user or token changes
  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      if (!user?.email || !token) return;

      try {
        const { data } = await api.get(
          `/news/check-subscription/${user.email}`
        );
        if (data?.isSubscribed !== undefined) {
          // If the subscription status is different from what we have, update user
          if (user.newsletterSubscription?.isActive !== data.isActive) {
            const { data: updatedUser } = await api.get("/users/me");
            if (updatedUser) {
              updateUser(updatedUser);
            }
          }
        }
      } catch (error) {
        console.error("Failed to check subscription status:", error);
      }
    };

    checkSubscriptionStatus();
  }, [user?.email, token]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (token) {
        refreshToken();
      }
    }, 14 * 60 * 1000); // Refresh every 14 minutes
    return () => clearInterval(interval);
  }, [token]);

  // Function to handle user login
  const login = (data: AuthState) => {
    if (data.user && data.token) {
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);
    }
  };

  // Function to handle user logout
  const logout = () => {
    // Call server to clear refresh cookie and revoke session
    try {
      api.post("/auth/logout").catch(() => { });
    } catch (e) {
      // ignore
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  // Function to update the user's profile
  const updateProfile = (profile: Partial<User["profile"]>) => {
    if (user) {
      const updatedUser = {
        ...user,
        profile: { ...user.profile, ...profile },
        updatedAt: new Date().toISOString(), // Update the timestamp
      };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    }
  };

  // Function to update the entire user object
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = {
        ...user,
        ...userData,
        updatedAt: new Date().toISOString(),
      };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    }
  };

  const verifyPassword = async (password: string): Promise<boolean> => {
    if (!user || !token) {
      throw new Error("You must be logged in to perform this action");
    }
    try {
      const { data } = await api.post("/auth/verify-password", { password });
      return data.valid;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error("Incorrect password. Please verify and try again.");
      }
      throw new Error(
        error.response?.data?.message ||
        "Something went wrong. Please try again."
      );
    }
  };

  const refreshToken = async (): Promise<string | null> => {
    try {
      const {
        data: { token: newToken },
      } = await api.post("/auth/refresh");
      if (newToken) {
        setToken(newToken);
        localStorage.setItem("token", newToken);
        return newToken;
      }
      return null;
    } catch (error) {
      console.error("Failed to refresh token", error);
      logout(); // Logout on refresh failure
      return null;
    }
  };

  // Function to refresh user data from server
  const refreshUser = async (): Promise<void> => {
    if (!token) {
      throw new Error("No authentication token available");
    }

    try {
      const { data: userData } = await api.get("/users/me");
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
    } catch (error) {
      console.error("Failed to refresh user data:", error);
      throw error;
    }
  };

  const value = {
    user,
    token,
    login,
    logout,
    isLoading,
    refreshToken,
    updateProfile,
    updateUser,
    refreshUser,
    verifyPassword,
    cookieConsent,
    setCookieConsent: (v: boolean) => {
      try {
        localStorage.setItem("cookieConsent", v ? "true" : "false");
        // also set cookieSettings defaults for accepted/declined
        const defaults = v
          ? ({
            necessary: true,
            preferences: true,
            analytics: true,
            marketing: true,
          } as const)
          : ({
            necessary: true,
            preferences: false,
            analytics: false,
            marketing: false,
          } as const);
        localStorage.setItem("cookieSettings", JSON.stringify(defaults));
        setCookieSettingsState(defaults as any);
      } catch (e) {
        // ignore
      }
      setCookieConsentState(v);
    },
    cookieSettings,
    setCookieSettings: (
      s: { preferences: boolean; analytics: boolean; marketing: boolean } | null
    ) => {
      try {
        if (s === null) {
          localStorage.removeItem("cookieSettings");
        } else {
          localStorage.setItem("cookieSettings", JSON.stringify(s));
        }
      } catch (e) {
        // ignore
      }
      setCookieSettingsState(s as any);
    },
    cookieModalOpen,
    setCookieModalOpen,
  };

  // Provide the context value to child components
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
