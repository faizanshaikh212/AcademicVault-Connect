// Defines the structure of the user object we get from the API
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  role: string[];
  settings: {
    theme: string;
  };
  profile: {
    avatar?: string;
    bio?: string;
    avatarHistory?: string[];
    isAvatarGif?: boolean;
  };
  premium: {
    isPremium: boolean;
    premiumSince?: string;
    premiumExpiry?: string;
    lastRenewal?: string;
  };
  socials?: {
    followersCount: number;
    followingCount: number;
    friendsCount: number;
  };
  isFollowing?: boolean;
  updatedAt?: string;
  newsletterSubscription?: {
    _id: string;
    isActive: boolean;
    subscriptionDate: string;
  };
  // Enhanced authentication fields
  isEmailVerified?: boolean;
  twoFactorEnabled?: boolean;
  lastPasswordChange?: string;
  failedLoginAttempts?: number;
  lockUntil?: string;
}

// Defines the structure of the authentication context's state
export interface AuthState {
  user: User | null;
  token: string | null;
}

// Defines the functions available in the authentication context
export interface AuthContextType extends AuthState {
  login: (data: AuthState) => void;
  logout: () => void;
  isLoading: boolean;
  updateProfile: (profile: Partial<User["profile"]>) => void;
  updateUser: (userData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  verifyPassword: (password: string) => Promise<boolean>;
  // Cookie settings: null = undecided. Necessary always true.
  cookieSettings: {
    necessary: true;
    preferences: boolean;
    analytics: boolean;
    marketing: boolean;
  } | null;
  setCookieSettings: (
    settings: {
      preferences: boolean;
      analytics: boolean;
      marketing: boolean;
    } | null
  ) => void;
  // Modal control for managing cookies
  cookieModalOpen: boolean;
  setCookieModalOpen: (v: boolean) => void;
  // Legacy simple consent (null = undecided)
  cookieConsent: boolean | null;
  setCookieConsent: (v: boolean) => void;
}

// Defines the structure for a single project
export interface Project {
  _id: string;
  title: string;
  description: string;
  coverImage: string;
  screenshots?: string[];
  projectLink?: string;
  sourceCodeLink?: string;
  extraLinks?: { title: string; url: string }[];
  socialMediaLinks?: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    instagram?: string;
    facebook?: string;
    youtube?: string;
    website?: string;
  };
  author: Pick<
    User,
    | "_id"
    | "username"
    | "firstName"
    | "lastName"
    | "profile"
    | "updatedAt"
    | "premium"
  >;
  tags: string[];
  createdAt: string;
}

// Defines the structure for a single blog post
export interface Blog {
  _id: string;
  title: string;
  content: string;
  coverImage: string;
  author: Pick<
    User,
    | "_id"
    | "username"
    | "firstName"
    | "lastName"
    | "profile"
    | "updatedAt"
    | "premium"
  >;
  tags: string[];
  createdAt: string;
}

// Defines the structure for a single notification
export interface Notification {
  _id: string;
  sender: Pick<User, "_id" | "username" | "profile">;
  type:
  | "follow"
  | "friend_request"
  | "friend_request_accepted"
  | "new_news"
  | "new_notice"
  | "role_approved"
  | "premium_approved";
  link: string;
  message?: string;
  isRead: boolean;
  isCleared?: boolean;
  createdAt: string;
}
