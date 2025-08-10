/**
 * Transforms a Cloudinary URL to handle GIF animations based on owner's premium status
 * @param url - The URL to transform
 * @param ownerIsPremium - Whether the owner of the content has premium status
 * @returns The transformed URL
 */
export function transformCloudinaryUrl(
  url: string | undefined,
  ownerIsPremium: boolean
): string {
  if (!url || !url.includes("cloudinary.com")) return url || "";

  // Extract parts from Cloudinary URL
  const [baseUrl, imagePath] = url.split("/upload/");
  if (!baseUrl || !imagePath) return url;

  // Check if the image is a GIF
  const isGif = imagePath.toLowerCase().includes(".gif");

  // Only transform GIFs when the owner is not premium
  if (isGif && !ownerIsPremium) {
    // Convert to static image if owner is not premium
    return `${baseUrl}/upload/f_auto,q_auto:good,e_loop:1,pg_1/${imagePath}`;
  }

  // For premium owners or non-GIF images, just optimize
  return `${baseUrl}/upload/f_auto,q_auto:good/${imagePath}`;
}

/**
 * Gets a Cloudinary URL with appropriate transformations based on content type and premium status
 * This function should be used for all Cloudinary images in the app
 * @param imageUrl - The original Cloudinary URL
 * @param viewerIsPremium - Whether the viewer has premium status
 * @param updatedAt - Optional timestamp for cache busting
 * @returns The transformed URL
 */
const DEFAULT_AVATAR_URL =
  "https://res.cloudinary.com/dsomufjp6/image/upload/v1704483053/default-avatar_wydacy.png";

export function getCloudinaryUrl(
  imageUrl: string | undefined,
  ownerIsPremium: boolean = false,
  updatedAt?: string
): string {
  // Use default avatar for undefined URLs
  const finalUrl = imageUrl || DEFAULT_AVATAR_URL;
  const transformedUrl = transformCloudinaryUrl(finalUrl, ownerIsPremium);

  // Add cache busting if updatedAt is provided
  if (updatedAt) {
    const timestamp = new Date(updatedAt).getTime();
    return `${transformedUrl}?t=${timestamp}`;
  }

  return transformedUrl;
}
