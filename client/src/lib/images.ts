export const getCoverImageUrl = (imageUrl?: string) => {
  if (!imageUrl) return "/default-cover.jpg";

  // Check if it's a GIF URL
  const isGif = imageUrl.toLowerCase().endsWith(".gif");

  // If it's a Cloudinary URL
  if (imageUrl.includes("cloudinary")) {
    // For GIFs in cards, always show static version
    if (isGif) {
      return imageUrl.replace("upload/", "upload/f_jpg/");
    }
    return imageUrl;
  }

  // For external GIF URLs, use images.weserv.nl to get the first frame
  if (isGif) {
    return `https://images.weserv.nl/?url=${encodeURIComponent(
      imageUrl
    )}&output=jpg&page=1`;
  }

  return imageUrl;
};
