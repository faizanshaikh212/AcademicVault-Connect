import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Configure Cloudinary with credentials from your .env file
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer storage to use Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Get fresh user data to check current premium status
    const User = (await import("../models/user.model.js")).default;
    const user = req.user ? await User.findById(req.user._id) : null;
    const isPremium = user?.premium?.isPremium || false;

    // Check file types
    const isGif = file.mimetype === "image/gif";
    const isAvatar = req.path.includes("avatar");

    // Create base transformations array
    let transformations = [];

    if (isAvatar) {
      // Avatar transformations
      transformations = [
        { width: 400, height: 400, crop: "fill", gravity: "center" },
        { quality: "auto" },
      ];

      // For non-premium users, make GIFs static
      if (isGif && !isPremium) {
        transformations.push({ page: 1 });
      }
    } else if (isGif) {
      // GIF transformations with optimized settings
      transformations = [
        {
          width: 800,
          crop: "limit",
          quality: "auto",
        },
      ];

      // For non-premium users, make gif static
      if (!isPremium) {
        transformations.push({ page: 1 });
      }
    } else {
      // Regular image transformations
      transformations = [
        {
          width: 1280,
          crop: "scale",
          format: "auto",
          quality: "auto",
        },
      ];
    }

    /**
     * Configuration settings for Cloudinary uploads
     * - Handles different file formats and sizes based on user premium status
     * - Applies automatic optimization and transformations
     * - Enforces size limits and format restrictions
     */
    return {
      folder: "academic-vault",
      allowed_formats: ["jpg", "jpeg", "png", "gif"],
      transformation: [
        ...transformations,
        // Make all GIFs static for non-premium users
        ...(isGif && !isPremium ? [{ page: 1 }] : []),
        // Add auto-optimization for all images
        {
          fetch_format: "auto",
          quality: "auto",
        },
      ],
      resource_type: "image",
      max_bytes: isGif
        ? 30 * 1024 * 1024
        : isPremium
        ? 20 * 1024 * 1024
        : 5 * 1024 * 1024, // 30MB for GIFs, 20MB for premium images, 5MB for regular
      format: "auto",
      // Ensure unique filenames
      filename_override: `${Date.now()}_${Math.random()
        .toString(36)
        .substring(2)}`,
      // Add eager transformation for large files
      eager_async: true,
    };
  },
});

export { cloudinary, storage };
