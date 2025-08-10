// Default avatar SVG as a data URL - a simple, professional placeholder
export const DEFAULT_AVATAR = `data:image/svg+xml,${encodeURIComponent(`
<svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="200" height="200" fill="#E5E7EB"/>
  <path d="M100 100C116.569 100 130 86.5685 130 70C130 53.4315 116.569 40 100 40C83.4315 40 70 53.4315 70 70C70 86.5685 83.4315 100 100 100ZM100 110C77.9086 110 60 127.909 60 150V160H140V150C140 127.909 122.091 110 100 110Z" fill="#9CA3AF"/>
</svg>
`)}`;

/**
 * Transforms Cloudinary URL to ensure proper GIF handling
 * @param url - The Cloudinary URL to transform
 * @param ownerIsPremium - Whether the OWNER of the content has premium status
 * @returns The transformed URL
 */
export function transformCloudinaryUrl(
  url: string,
  ownerIsPremium: boolean
): string {
  // Return original URL if it's not a Cloudinary URL or is empty
  if (!url || !url.includes("cloudinary.com")) return url || "";

  // Split the URL at /upload/
  const [baseUrl, ...rest] = url.split("/upload/");
  if (!baseUrl || !rest.length) return url;

  // Join all parts after /upload/ in case there were multiple
  const imagePath = rest.join("/upload/");

  // Check if it's a GIF
  const isGif = imagePath.toLowerCase().includes(".gif");

  if (isGif) {
    if (ownerIsPremium) {
      // If owner is premium, preserve GIF animation
      return url; // Return original URL to ensure animation works
    } else {
      // If not premium, convert to static image
      return `${baseUrl}/upload/q_auto:good,f_jpg/${imagePath}`;
    }
  }

  // For non-GIFs, just ensure quality optimization
  return `${baseUrl}/upload/q_auto:good/${imagePath}`;
}

/**
 * Gets the avatar or image URL with appropriate transformations based on content owner's premium status
 * @param imageUrl - The URL from the user's profile or content
 * @param ownerIsPremium - Whether the OWNER of the content has premium status
 * @param updatedAt - The update timestamp for cache busting (optional)
 * @returns The final URL with proper transformations and cache busting
 */
export function getAvatarUrl(
  imageUrl: string | undefined,
  ownerIsPremium: boolean = false,
  updatedAt?: string
): string {
  // Handle empty or invalid URLs
  if (!imageUrl || imageUrl.trim() === "") return DEFAULT_AVATAR;

  // Ensure URL is properly formatted
  const cleanUrl = imageUrl.trim();

  // Transform the URL based on premium status and type
  const transformedUrl = transformCloudinaryUrl(cleanUrl, ownerIsPremium);

  // Add cache busting for avatar updates
  if (updatedAt) {
    const timestamp = new Date(updatedAt).getTime();
    return `${transformedUrl}?t=${timestamp}`;
  }

  return transformedUrl;
}
