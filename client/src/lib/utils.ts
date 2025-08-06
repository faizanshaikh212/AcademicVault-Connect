import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * A utility function to conditionally join class names together.
 * It uses tailwind-merge to intelligently merge Tailwind CSS classes
 * without style conflicts.
 * @param inputs - A list of class names.
 * @returns A string of merged class names.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns an avatar URL with cache busting if the user has a custom avatar,
 * or a fallback avatar if not.
 * @param avatar - The avatar URL from the user's profile
 * @param userId - The user's ID for the fallback avatar
 * @param updatedAt - The user's last update timestamp
 * @param size - The size of the fallback avatar (default: 40)
 * @returns The final avatar URL with cache busting if needed
 */
export function getAvatarUrl(
  avatar: string | undefined,
  userId: string,
  updatedAt: string | undefined,
  size: number = 40
) {
  if (avatar) {
    const timestamp = updatedAt ? new Date(updatedAt).getTime() : Date.now();
    return `${avatar}?t=${timestamp}`;
  }
  return `https://i.pravatar.cc/${size}?u=${userId}`;
}
