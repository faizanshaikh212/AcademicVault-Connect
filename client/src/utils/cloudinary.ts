export const getCloudinaryUrl = (url: string, isPremium: boolean): string => {
  if (!url || !url.includes("cloudinary.com")) return url;

  // If it's a GIF and user is not premium, modify the URL to show only first frame
  if (url.toLowerCase().endsWith(".gif") && !isPremium) {
    // Split the URL at 'upload/'
    const [baseUrl, imagePath] = url.split("upload/");
    if (!baseUrl || !imagePath) return url;

    // Add the page_1 transformation
    return `${baseUrl}upload/pg_1/${imagePath}`;
  }

  return url;
};
