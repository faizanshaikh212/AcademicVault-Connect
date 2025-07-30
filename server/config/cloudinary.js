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
  params: {
    folder: "academic-vault", // The name of the folder in your Cloudinary account
    allowed_formats: ["jpeg", "jpg", "png", "gif", "md", "html", "css", "js"], // Allowed file formats
    // A function to generate a public_id for the file (optional)
    // public_id: (req, file) => 'computed-filename-using-request',
  },
});

export { cloudinary, storage };
