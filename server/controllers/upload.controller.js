/**
 * @desc    Upload a file and get its details
 * @route   POST /api/upload
 * @access  Private
 */
const uploadFile = (req, res) => {
  // Multer and Cloudinary storage will handle the upload.
  // If the file is successfully uploaded, req.file will contain its details.
  if (!req.file) {
    return res
      .status(400)
      .json({ message: "No file uploaded. Please select a file." });
  }

  // Send back the details of the uploaded file provided by Cloudinary
  res.status(200).json({
    message: "File uploaded successfully.",
    filePath: req.file.path, // The URL of the uploaded file
    fileType: req.file.mimetype,
    originalName: req.file.originalname,
    fileSize: req.file.size,
  });
};

export { uploadFile };
