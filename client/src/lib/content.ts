/**
 * Transforms content URL to control GIF animation
 * @param url - The URL of the content (image)
 * @param allowAnimation - Whether to allow GIF animation
 * @returns The transformed URL
 */
export function transformContentUrl(
  url: string,
  allowAnimation: boolean = false
): string {
  // Return original URL if it's empty
  if (!url || url.trim() === "") return url;

  // Check if it's a GIF either by extension or URL path
  const isGif = url.toLowerCase().includes(".gif");

  // If it's not a GIF or we want to allow animation, return original URL
  if (!isGif || allowAnimation) return url;

  if (url.includes("cloudinary.com")) {
    // For Cloudinary URLs, convert to static image format
    const [baseUrl, ...rest] = url.split("/upload/");
    if (!baseUrl || !rest.length) return url;
    const imagePath = rest.join("/upload/");
    return `${baseUrl}/upload/f_jpg,q_auto/${imagePath}`;
  } else if (url.startsWith("http") || url.startsWith("https")) {
    // For other URLs, append a parameter to get first frame
    // This works with some CDNs and image servers
    if (url.includes("?")) {
      return `${url}&frame=1`;
    }
    return `${url}?frame=1`;
  }

  return url;
}

/**
 * Gets the content cover URL with appropriate transformations
 * @param imageUrl - The URL of the content cover image
 * @param allowAnimation - Whether to allow GIF animation
 * @returns The transformed URL
 */
export function getContentCoverUrl(
  imageUrl: string | undefined,
  allowAnimation: boolean = false
): string {
  // Handle empty or invalid URLs
  if (!imageUrl || imageUrl.trim() === "") return "";

  // Ensure URL is properly formatted
  const cleanUrl = imageUrl.trim();

  // Transform the URL based on whether animation is allowed
  return transformContentUrl(cleanUrl, allowAnimation);
}
