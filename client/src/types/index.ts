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
  verifyPassword: (password: string) => Promise<boolean>;
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
  author: Pick<
    User,
    "_id" | "username" | "firstName" | "lastName" | "profile" | "updatedAt"
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
    "_id" | "username" | "firstName" | "lastName" | "profile" | "updatedAt"
  >;
  tags: string[];
  createdAt: string;
}

// Defines the structure for a single notification
export interface Notification {
  _id: string;
  sender: Pick<User, "_id" | "username" | "profile">;
  type: "follow" | "friend_request";
  link: string;
  isRead: boolean;
  createdAt: string;
}
